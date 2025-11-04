import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Bell, BarChart3, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';

const navItems = [
  { path: '/', label: 'Главная', icon: Home },
  { path: '/survey', label: 'Опрос', icon: BarChart3 },
  { path: '/results', label: 'Результаты', icon: Sparkles },
  { path: '/employees', label: 'Сотрудники', icon: Users },
  { path: '/notifications', label: 'Рассылка', icon: Bell },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { currentStep, answers } = useStore();
  const totalSteps = 3;
  const progress = location.pathname === '/survey' 
    ? ((currentStep + 1) / (totalSteps + 1)) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-text">CultureOS</span>
            </Link>
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-primary'
                      : 'text-gray-600 hover:text-primary'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
          {progress > 0 && (
            <div className="h-1 bg-gray-200">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}