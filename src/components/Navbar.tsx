import { Phone } from 'lucide-react';
import { Link } from 'react-router';

const Navbar = () => {

    const handleWhatsAppContact = () => {
        const phoneNumber = '584146772709';
        const message = 'Hola! Me interesa conocer más sobre los servicios de Donaive.';
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <nav className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white shadow-lg px-4 py-2 sticky top-0 z-50">
            <div className="flex justify-between items-center max-w-7xl mx-auto">
                {/* Logo / Brand Name */}
                <Link to="/" className="text-xl font-bold tracking-wide flex items-center gap-2 text-white hover:text-blue-300 transition-colors duration-200">
                    <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">DONAIVE</span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden sm:flex items-center gap-4">
                    <button
                        onClick={handleWhatsAppContact}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                        <Phone className="w-4 h-4" />
                        CONTACTO
                    </button>
                </div>

                {/* Mobile Contact Button */}
                <button
                    className="sm:hidden flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all duration-200 shadow-md hover:shadow-lg"
                    onClick={handleWhatsAppContact}
                >
                    <Phone className="w-4 h-4" />
                    CONTACTO
                </button>
            </div>

        </nav>
    );
};

export default Navbar;