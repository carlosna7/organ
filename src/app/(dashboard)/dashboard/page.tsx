import { getUserData } from '@/lib/auth';
import { logoutAction } from '@/actions/auth';

export default async function DashboardPage() {

  // Verificar autenticação e obtem dados do usuário
  const userData = await getUserData();
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        {/* Form para logout usando Server Action */}
        <form action={logoutAction}>
          <button 
            type="submit"
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
          >
            Logout
          </button>
        </form>
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <p>Bem-vindo ao dashboard! Você está autenticado.</p>
        <p className="text-sm text-gray-600 mt-2">
          Esta página só é acessível para usuários autenticados.
        </p>
      </div>
    </div>
  );
}