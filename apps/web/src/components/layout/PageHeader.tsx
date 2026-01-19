import { motion } from 'framer-motion';

interface PageHeaderProps {
    title: string;
    description?: string;
    backgroundImage?: string;
}

export default function PageHeader({
    title,
    description,
    backgroundImage = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80"
}: PageHeaderProps) {
    return (
        <div className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden bg-gray-900">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gray-900/80 z-10" />
                <img
                    src={backgroundImage}
                    alt={title}
                    className="w-full h-full object-cover opacity-50"
                />
            </div>

            <div className="container relative z-20 mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl lg:text-5xl font-bold text-white mb-4"
                >
                    {title}
                </motion.h1>

                {description && (
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-lg text-gray-300 max-w-2xl mx-auto"
                    >
                        {description}
                    </motion.p>
                )}
            </div>
        </div>
    );
}
