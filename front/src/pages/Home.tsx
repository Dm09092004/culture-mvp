import { ArrowRight, Zap, Users, Target, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const features = [
    { icon: Zap, title: 'За 5 минут', desc: 'Создайте культуру без долгих консультаций' },
    { icon: Target, title: 'На основе данных', desc: 'Анализ ответов сотрудников' },
    { icon: Users, title: 'Для всей команды', desc: 'Вовлекайте каждого' },
    { icon: Heart, title: 'С душой', desc: 'Ценности, которые вдохновляют' },
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section
        className="text-center py-20"
        style={{
          opacity: 0,
          animation: 'fadeIn 0.6s ease-out forwards'
        }}
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
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="card text-center"
            style={{
              opacity: 0,
              animation: `fadeIn 0.5s ease-out ${i * 0.1}s forwards`
            }}
          >
            <f.icon className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-gray-600 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}