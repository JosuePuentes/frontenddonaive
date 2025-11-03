    import { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X, ChevronDown, LogOut, Home, BarChart, DollarSign, Users, Phone, Search } from 'lucide-react';
import { motion } from 'framer-motion';

// Permisos y enlaces agrupados para una mejor organización visual
const allLinks = [
    {
        category: 'Resumen',
        icon: BarChart,
        items: [
            { to: '/gastoscxc-cuadres', label: 'Gastos, Cuentas y Cuadres', permiso: 'agregar_cuadre' },
            { to: '/resumenfarmacias', label: 'Resumen de Ventas', permiso: 'ver_resumen_mensual' },
            { to: '/ventatotal', label: 'Venta Total', permiso: 'ver_ventas_totales' },
            { to: '/metas', label: 'Metas', permiso: 'ver_about' },
            { to: '/gestionmetas', label: 'Crear Meta', permiso: 'metas' },
            { to: '/metasconf', label: 'Metas Configuración', permiso: 'ver_about' },
        ]
    },
    {
        category: 'Cuadres',
        icon: BarChart,
        items: [
            { to: '/agregarcuadre', label: 'Agregar Cuadre', permiso: 'agregar_cuadre' },
            { to: '/cuadresporfarmacia', label: 'Mis Cuadres', permiso: 'agregar_cuadre' },
            { to: '/verificacion-cuadres', label: 'Verificación Cuadres', permiso: 'verificar_cuadres' },
            { to: '/ver-cuadres-dia', label: 'Cuadres por Día', permiso: 'ver_cuadres_dia' },
            { to: '/visualizarcuadres', label: 'Visualizar Cuadres', permiso: 'ver_cuadres_dia' },
            { to: '/modificar-cuadre', label: 'Modificar Cuadre', permiso: 'modificar_cuadre' },
        ]
    },
    {
        category: 'Gastos',
        icon: DollarSign,
        items: [
            { to: '/agregargastos', label: 'Agregar Gasto', permiso: 'agregar_cuadre' },
            { to: '/gastosporusuario', label: 'Mis Gastos', permiso: 'agregar_cuadre' },
            { to: '/verificaciongastos', label: 'Verificación Gastos', permiso: 'verificar_gastos' },
            { to: '/vergastos', label: 'Ver Gastos (Admin)', permiso: 'verificar_gastos' },
        ]
    },
    {
        category: 'Cuentas Por Pagar',
        icon: Users,
        items: [
            { to: '/cuentasporpagar', label: 'Agregar Cuenta Por Pagar', permiso: 'agregar_cuadre' },
            { to: '/vercuentasporpagar', label: 'Ver Cuentas por Pagar', permiso: 'verificar_gastos' },
            { to: '/verificacioncuentasporpagar', label: 'Verificación Cuentas por Pagar', permiso: 'verificar_gastos' },
            { to: '/pagoscpp', label: 'Ver Pagos CxP', permiso: 'verificar_gastos' },
        ]
    },
    
    {
        category: 'RRHH',
        icon: Users,
        items: [
            { to: '/cajeros', label: 'Vendedores', permiso: 'cajeros' },
            { to: '/comisiones', label: 'Comisiones Por Turno', permiso: 'comisiones' },
            { to: '/comisionesgenerales', label: 'Comisiones Generales', permiso: 'comisiones' },
        ]
    },
    {
        category: 'Administración',
        icon: Users,
        items: [
            { to: '/register', label: 'Agregar Usuario', permiso: 'acceso_admin' },
            { to: '/modificar-usuarios', label: 'Modificación de Usuario', permiso: 'acceso_admin' },
            { to: '/valesporfarmacia', label: 'Vales por Negocio', permiso: 'ver_cuadres_dia' },
            { to: '/agregarinventariocosto', label: 'Agregar Costo Inv', permiso: 'acceso_admin' },
            { to: '/verinventarios', label: 'Ver Inventarios', permiso: 'acceso_admin' },
        ]
    },
    
    {
        category: 'Inicio',
        icon: Home,
        items: [
            { to: '/admin', label: 'Dashboard', permiso: 'acceso_admin' },
        ]
    },
];

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [permisosUsuario, setPermisosUsuario] = useState<string[]>([]);
    const [usuario, setUsuario] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const location = useLocation();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    // Effect for handling user data and permissions from localStorage
    useEffect(() => {
        const storedUsuario = JSON.parse(localStorage.getItem('usuario') || 'null');
        setUsuario(storedUsuario);
        setPermisosUsuario(storedUsuario?.permisos || []);

        const handleStorageChange = () => {
            const updatedUsuario = JSON.parse(localStorage.getItem('usuario') || 'null');
            setUsuario(updatedUsuario);
            setPermisosUsuario(updatedUsuario?.permisos || []);
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Effect for handling clicks outside dropdown/mobile menu to close them
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Close desktop dropdown
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
                setSearchTerm(''); // Limpiar búsqueda al cerrar
            }
            // Close mobile menu if open and click is outside the menu and not on the toggle button
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && isMobileMenuOpen) {
                const mobileButton = document.querySelector('[aria-label="Toggle mobile menu"]');
                if (mobileButton && !mobileButton.contains(event.target as Node)) {
                    setIsMobileMenuOpen(false);
                    setSearchTerm(''); // Limpiar búsqueda al cerrar
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobileMenuOpen]);

    // Limpiar búsqueda cuando se cierra el menú
    useEffect(() => {
        if (!isDropdownOpen && !isMobileMenuOpen) {
            setSearchTerm('');
        }
    }, [isDropdownOpen, isMobileMenuOpen]);

    // Filter links based on user permissions
    const accessibleLinks = permisosUsuario.length > 0
        ? allLinks.map(category => ({
            ...category,
            items: category.items.filter(link => !link.permiso || permisosUsuario.includes(link.permiso))
        })).filter(category => category.items.length > 0)
        : [];

    // Filter links based on search term
    const filteredLinks = searchTerm.trim() === ''
        ? accessibleLinks
        : accessibleLinks.map(category => ({
            ...category,
            items: category.items.filter(link => {
                const matchesCategory = category.category.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesLabel = link.label.toLowerCase().includes(searchTerm.toLowerCase());
                return matchesCategory || matchesLabel;
            })
        })).filter(category => category.items.length > 0);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/login';
    };

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
                <Link to="/" className="text-xl font-bold tracking-wide flex flex-col items-center gap-1 text-white hover:text-blue-300 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                        <img 
                            src="/logo.png" 
                            alt="Donaive Logo" 
                            className="h-12 w-12 object-contain"
                        />
                        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">DONAIVE</span>
                    </div>
                    <span className="text-xs text-blue-200 font-medium">Futuro. Finanzas. Digital</span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden sm:flex items-center gap-4 relative" ref={dropdownRef}>
                    {/* Mostrar MÓDULOS solo si está logueado */}
                    {usuario && accessibleLinks.length > 0 && (
                        <button
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg text-blue-100 hover:text-white hover:bg-blue-800/50 transition-all duration-200"
                            onClick={() => setIsDropdownOpen(prev => !prev)}
                            aria-expanded={isDropdownOpen}
                        >
                            MÓDULOS
                            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                        </button>
                    )}

                    <button
                        onClick={handleWhatsAppContact}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                        <Phone className="w-4 h-4" />
                        CONTACTO
                    </button>

                    {/* Dropdown de módulos solo si está logueado */}
                    {usuario && isDropdownOpen && accessibleLinks.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-3 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
                        >
                            {/* Campo de búsqueda */}
                            <div className="p-3 border-b border-gray-200 bg-gray-50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar módulos..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="py-2 max-h-[80vh] overflow-y-auto custom-scrollbar">
                                {filteredLinks.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                        No se encontraron módulos que coincidan con "{searchTerm}"
                                    </div>
                                ) : (
                                    filteredLinks.map(category => (
                                    <div key={category.category} className="mb-2">
                                        <h3 className="px-4 pt-3 pb-2 text-xs font-bold uppercase text-gray-700 flex items-center gap-2 border-b border-gray-100">
                                            {category.icon && <category.icon className="w-4 h-4 text-gray-700" />}
                                            {category.category}
                                        </h3>
                                        <ul className="pb-1">
                                            {category.items.map(link => (
                                                <li key={link.to}>
                                                    <Link
                                                        to={link.to}
                                                        onClick={() => setIsDropdownOpen(false)}
                                                        className={`block px-4 py-2 text-sm whitespace-nowrap transition-all duration-150 rounded mx-2 my-1
                                                            ${location.pathname === link.to
                                                                ? 'text-black font-semibold bg-gray-100 hover:bg-gray-200'
                                                                : 'text-gray-800 hover:text-black hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {link.label}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    ))}
                                )}
                                <div className="border-t border-gray-200 pt-2 mt-2">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded mx-2 my-1 flex items-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" /> Cerrar sesión
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="sm:hidden p-1.5 rounded-lg hover:bg-blue-800/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(prev => !prev)}
                    aria-label="Toggle mobile menu"
                >
                    {isMobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
                </button>
            </div>

            {/* Mobile Menu Content (Animated Slide-in) */}
            <motion.div
                ref={mobileMenuRef}
                initial={false}
                animate={isMobileMenuOpen ? "open" : "closed"}
                variants={{
                    open: { opacity: 1, height: "auto", transition: { duration: 0.3 } },
                    closed: { opacity: 0, height: 0, transition: { duration: 0.3 } }
                }}
                className="sm:hidden mt-4 bg-blue-900/20 backdrop-blur-sm rounded-lg shadow-xl overflow-y-auto overflow-x-hidden max-h-[70vh] border border-blue-800/30"
            >
                <div className="p-4 custom-scrollbar">
                    {/* Campo de búsqueda móvil */}
                    {usuario && accessibleLinks.length > 0 && (
                        <div className="mb-4 pb-4 border-b border-blue-800/30">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300" />
                                <input
                                    type="text"
                                    placeholder="Buscar módulos..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 text-sm bg-blue-800/30 border border-blue-700/50 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                />
                            </div>
                        </div>
                    )}
                    {/* Mostrar módulos solo si está logueado */}
                    {usuario && accessibleLinks.length > 0 && (
                        <>
                            {filteredLinks.length === 0 ? (
                                <div className="px-4 py-6 text-center text-blue-200 text-sm">
                                    No se encontraron módulos que coincidan con "{searchTerm}"
                                </div>
                            ) : (
                                filteredLinks.map(category => (
                                <div key={category.category} className="mb-4 last:mb-0">
                                    <h3 className="text-sm font-bold uppercase text-blue-200 mb-2 flex items-center gap-2">
                                        {category.icon && <category.icon className="w-4 h-4" />}
                                        {category.category}
                                    </h3>
                                    <ul className="space-y-1">
                                        {category.items.map(link => (
                                            <li key={link.to}>
                                                <Link
                                                    to={link.to}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className={`block px-3 py-2 text-sm transition-all duration-150 rounded
                                                        ${location.pathname === link.to
                                                            ? 'text-white font-semibold bg-blue-800/50'
                                                            : 'text-blue-100 hover:text-white hover:bg-blue-800/30'
                                                        }`}
                                                >
                                                    {link.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                            )}
                            <div className="border-t border-blue-800/30 pt-4 mt-4">
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 rounded flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" /> Cerrar sesión
                                </button>
                            </div>
                        </>
                    )}
                    
                    {/* Botón de Contacto WhatsApp en móvil */}
                    <div className="border-t border-blue-800/30 pt-4 mt-4">
                        <button
                            onClick={handleWhatsAppContact}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all duration-200 shadow-md hover:shadow-lg mb-4"
                        >
                            <Phone className="w-4 h-4" />
                            CONTACTO WHATSAPP
                        </button>
                    </div>
                </div>
            </motion.div>
        </nav>
    );
};

export default Navbar;