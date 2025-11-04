import { ArrowRight, Zap, Users, Target, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Home() {
  const features = [
    { icon: Zap, title: 'За 5 минут', desc: 'Создайте культуру без долгих консультаций' },
    { icon: Target, title: 'На основе данных', desc: 'Анализ ответов сотрудников' },
    { icon: Users, title: 'Для всей команды', desc: 'Вовлекайте каждого' },
    { icon: Heart, title: 'С душой', desc: 'Ценности, которые вдохновляют' },
  ];

  return (
    <div className="space-y-20">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <h1 className="text-5xl md:text-6xl font-bold text-text mb-6">
          Сформируйте <span className="text-primary">корпоративную культуру</span><br />
          за 5 минут
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Опрос → Ценности → Миссия → Рассылка. Всё в одном месте.
        </p>
        <Link to="/survey" className="btn-primary text-lg inline-flex items-center space-x-2">
          <span>Создать культуру</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.section>

      {/* Features */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card text-center"
          >
            <f.icon className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-gray-600 text-sm">{f.desc}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}