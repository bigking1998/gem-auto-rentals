import prisma from '../lib/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

// Tier thresholds (lifetime points required)
const TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 1000,
  GOLD: 5000,
  PLATINUM: 15000,
};

// Tier multipliers for earning points
const TIER_MULTIPLIERS = {
  BRONZE: 1.0,
  SILVER: 1.1,
  GOLD: 1.25,
  PLATINUM: 1.5,
};

// Points redemption rate: 100 points = $1
const POINTS_PER_DOLLAR = 100;

// Points earning rate: $1 spent = 1 base point
const DOLLARS_PER_POINT = 1;

export const loyaltyService = {
  /**
   * Get or create a loyalty account for a user
   * Uses upsert to prevent race conditions on simultaneous account creation
   */
  async getOrCreateAccount(userId: string) {
    const account = await prisma.loyaltyAccount.upsert({
      where: { userId },
      create: { userId },
      update: {}, // No update needed if exists
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return account;
  },

  /**
   * Get loyalty account by user ID
   */
  async getAccount(userId: string) {
    return prisma.loyaltyAccount.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
  },

  /**
   * Calculate points to earn based on booking amount and tier
   */
  calculatePointsToEarn(amount: number | Decimal, tier: keyof typeof TIER_MULTIPLIERS): number {
    const basePoints = Math.floor(Number(amount) / DOLLARS_PER_POINT);
    const multiplier = TIER_MULTIPLIERS[tier];
    return Math.floor(basePoints * multiplier);
  },

  /**
   * Calculate dollar value of points
   */
  calculatePointsValue(points: number): number {
    return points / POINTS_PER_DOLLAR;
  },

  /**
   * Calculate how many points needed for a dollar amount
   */
  calculatePointsNeeded(dollarAmount: number): number {
    return dollarAmount * POINTS_PER_DOLLAR;
  },

  /**
   * Calculate tier based on lifetime points
   */
  calculateTier(lifetimePoints: number): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' {
    if (lifetimePoints >= TIER_THRESHOLDS.PLATINUM) return 'PLATINUM';
    if (lifetimePoints >= TIER_THRESHOLDS.GOLD) return 'GOLD';
    if (lifetimePoints >= TIER_THRESHOLDS.SILVER) return 'SILVER';
    return 'BRONZE';
  },

  /**
   * Get tier progress info
   */
  getTierProgress(lifetimePoints: number) {
    const currentTier = this.calculateTier(lifetimePoints);
    const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as const;
    const currentTierIndex = tiers.indexOf(currentTier);
    const nextTier = currentTierIndex < 3 ? tiers[currentTierIndex + 1] : null;
    const nextTierThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : null;
    const pointsToNextTier = nextTierThreshold ? nextTierThreshold - lifetimePoints : 0;
    const currentTierThreshold = TIER_THRESHOLDS[currentTier];
    const progressToNextTier = nextTierThreshold
      ? ((lifetimePoints - currentTierThreshold) / (nextTierThreshold - currentTierThreshold)) * 100
      : 100;

    return {
      currentTier,
      nextTier,
      pointsToNextTier: Math.max(0, pointsToNextTier),
      progressToNextTier: Math.min(100, Math.max(0, progressToNextTier)),
      multiplier: TIER_MULTIPLIERS[currentTier],
    };
  },

  /**
   * Award points to a user (e.g., after completing a booking)
   * Uses atomic increment to prevent race conditions
   */
  async awardPoints(
    userId: string,
    points: number,
    description: string,
    bookingId?: string
  ) {
    // Get or create account first
    await this.getOrCreateAccount(userId);

    // Use transaction with atomic operations to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Fetch fresh account data inside transaction
      const account = await tx.loyaltyAccount.findUnique({
        where: { userId },
      });

      if (!account) {
        throw new Error('Loyalty account not found');
      }

      // Create the transaction record
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: 'EARNED',
          points,
          description,
          bookingId,
        },
      });

      // Calculate new tier based on updated lifetime points
      const newLifetimePoints = account.lifetimePoints + points;
      const newTier = this.calculateTier(newLifetimePoints);

      // Use atomic increment to update account
      const updatedAccount = await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: { increment: points },
          lifetimePoints: { increment: points },
          tier: newTier,
        },
      });

      return { transaction, account: updatedAccount };
    });

    return result;
  },

  /**
   * Award bonus points (for promos, referrals, etc.)
   * Uses atomic increment to prevent race conditions
   */
  async awardBonusPoints(
    userId: string,
    points: number,
    description: string
  ) {
    // Get or create account first
    await this.getOrCreateAccount(userId);

    const result = await prisma.$transaction(async (tx) => {
      // Fetch fresh account data inside transaction
      const account = await tx.loyaltyAccount.findUnique({
        where: { userId },
      });

      if (!account) {
        throw new Error('Loyalty account not found');
      }

      const transaction = await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: 'BONUS',
          points,
          description,
        },
      });

      const newLifetimePoints = account.lifetimePoints + points;
      const newTier = this.calculateTier(newLifetimePoints);

      const updatedAccount = await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: { increment: points },
          lifetimePoints: { increment: points },
          tier: newTier,
        },
      });

      return { transaction, account: updatedAccount };
    });

    return result;
  },

  /**
   * Redeem points for a discount
   * Uses atomic decrement with check inside transaction to prevent race conditions
   */
  async redeemPoints(
    userId: string,
    points: number,
    description: string,
    bookingId?: string
  ) {
    // Get or create account first
    await this.getOrCreateAccount(userId);

    const result = await prisma.$transaction(async (tx) => {
      // Fetch fresh account data inside transaction to check current balance
      const account = await tx.loyaltyAccount.findUnique({
        where: { userId },
      });

      if (!account) {
        throw new Error('Loyalty account not found');
      }

      // Check balance inside transaction to prevent race conditions
      if (account.points < points) {
        throw new Error(`Insufficient points. Available: ${account.points}, Required: ${points}`);
      }

      const transaction = await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: 'REDEEMED',
          points: -points, // Negative for redemption
          description,
          bookingId,
        },
      });

      const updatedAccount = await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: { decrement: points },
        },
      });

      return { transaction, account: updatedAccount, dollarValue: this.calculatePointsValue(points) };
    });

    return result;
  },

  /**
   * Get transaction history for an account
   */
  async getTransactionHistory(userId: string, page = 1, limit = 20) {
    const account = await this.getAccount(userId);
    if (!account) {
      return { transactions: [], total: 0, page, limit, totalPages: 0 };
    }

    const [transactions, total] = await Promise.all([
      prisma.loyaltyTransaction.findMany({
        where: { accountId: account.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.loyaltyTransaction.count({
        where: { accountId: account.id },
      }),
    ]);

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Admin: Adjust points manually
   * Uses atomic operations to prevent race conditions
   */
  async adjustPoints(
    userId: string,
    points: number,
    description: string,
    adminUserId: string
  ) {
    // Get or create account first
    await this.getOrCreateAccount(userId);

    const result = await prisma.$transaction(async (tx) => {
      // Fetch fresh account data inside transaction
      const account = await tx.loyaltyAccount.findUnique({
        where: { userId },
      });

      if (!account) {
        throw new Error('Loyalty account not found');
      }

      // Check for negative balance inside transaction
      const newPoints = account.points + points;
      if (newPoints < 0) {
        throw new Error('Cannot adjust to negative points balance');
      }

      const transaction = await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: 'ADJUSTMENT',
          points,
          description: `${description} (adjusted by admin ${adminUserId})`,
        },
      });

      // Only add to lifetime if positive
      const newLifetimePoints = points > 0
        ? account.lifetimePoints + points
        : account.lifetimePoints;
      const newTier = this.calculateTier(newLifetimePoints);

      const updatedAccount = await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: points > 0 ? { increment: points } : { decrement: Math.abs(points) },
          lifetimePoints: points > 0 ? { increment: points } : undefined,
          tier: newTier,
        },
      });

      return { transaction, account: updatedAccount };
    });

    return result;
  },
};

export default loyaltyService;
