import { ReactNode } from 'react';
import { Building2 } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      {/* Left Pane - Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-blue-900 text-white p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
              <Building2 className="w-8 h-8 text-blue-100" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Condominium CRM</span>
          </div>
          <div className="mt-24 max-w-lg">
            <h1 className="text-4xl font-extrabold tracking-tight mb-6 leading-tight">
              A plataforma inteligente para a gestão do seu condomínio.
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed">
              Centralize ocorrências, atendimento via WhatsApp, controle de acesso e comunicação com moradores em um só lugar.
            </p>
          </div>
        </div>
        
        <div className="text-sm text-blue-300 font-medium">
          &copy; {new Date().getFullYear()} Condominium CRM. Todos os direitos reservados.
        </div>
      </div>

      {/* Right Pane - Content */}
      <div className="flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
