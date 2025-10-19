import React, { useState, createContext, useMemo, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import WeeklyView from './components/WeeklyView';
import Chatbot from './components/Chatbot';
import { Page, Medicine, Reminder, AdherenceLog } from './types';
import { DashboardIcon, CalendarIcon, ChatIcon, SunIcon, MoonIcon, PillIcon } from './components/icons';

interface AppContextType {
    medicines: Medicine[];
    addMedicine: (medicine: Medicine) => void;
    reminders: Reminder[];
    addReminder: (reminder: Omit<Reminder, 'id' | 'medicineName'>) => void;
    adherenceLogs: AdherenceLog[];
    logAdherence: (reminderId: string, status: 'taken' | 'skipped') => void;
}

export const AppContext = createContext<AppContextType>({
    medicines: [],
    addMedicine: () => {},
    reminders: [],
    addReminder: () => {},
    adherenceLogs: [],
    logAdherence: () => {},
});

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
            isActive
                ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-300'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
    >
        {icon}
        <span className="mt-1 sm:mt-0 sm:ml-2">{label}</span>
    </button>
);

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [adherenceLogs, setAdherenceLogs] = useState<AdherenceLog[]>([]);
    const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const addMedicine = (medicine: Medicine) => {
        setMedicines(prev => [...prev, medicine]);
    };

    const addReminder = (reminder: Omit<Reminder, 'id' | 'medicineName'>) => {
        const medicine = medicines.find(m => m.id === reminder.medicineId);
        if (medicine) {
            const newReminder: Reminder = {
                ...reminder,
                id: Date.now().toString(),
                medicineName: medicine.name,
            };
            setReminders(prev => [...prev, newReminder]);
        }
    };

    const logAdherence = (reminderId: string, status: 'taken' | 'skipped') => {
        const todayDate = new Date().toISOString().split('T')[0];
        setAdherenceLogs(prev => {
            const otherLogs = prev.filter(log => !(log.reminderId === reminderId && log.date === todayDate));
            return [...otherLogs, { reminderId, date: todayDate, status }];
        });
    };

    const contextValue = useMemo(() => ({
        medicines,
        addMedicine,
        reminders,
        addReminder,
        adherenceLogs,
        logAdherence
    }), [medicines, reminders, adherenceLogs]);

    const renderPage = () => {
        switch (currentPage) {
            case Page.Dashboard:
                return <Dashboard />;
            case Page.WeeklyView:
                return <WeeklyView />;
            case Page.Chatbot:
                return <Chatbot />;
            default:
                return <Dashboard />;
        }
    };
    
    return (
        <AppContext.Provider value={contextValue}>
            <div className="min-h-screen bg-gray-50 dark:bg-black dark:bg-gradient-to-br dark:from-black dark:via-[#101010] dark:to-gray-900 text-gray-900 dark:text-gray-100 font-sans">
                <header className="bg-white/95 dark:bg-black/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-20">
                            <div className="flex items-center">
                                <PillIcon className="h-8 w-8 text-orange-500" />
                                <h1 className="ml-3 text-2xl font-bold text-gray-800 dark:text-white">Pill Papa AI</h1>
                            </div>
                            <nav className="hidden sm:flex items-center space-x-4">
                                <NavItem
                                    icon={<DashboardIcon className="h-5 w-5"/>}
                                    label="Dashboard"
                                    isActive={currentPage === Page.Dashboard}
                                    onClick={() => setCurrentPage(Page.Dashboard)}
                                />
                                <NavItem
                                    icon={<CalendarIcon className="h-5 w-5"/>}
                                    label="Weekly View"
                                    isActive={currentPage === Page.WeeklyView}
                                    onClick={() => setCurrentPage(Page.WeeklyView)}
                                />
                                <NavItem
                                    icon={<ChatIcon className="h-5 w-5"/>}
                                    label="AI Chat"
                                    isActive={currentPage === Page.Chatbot}
                                    onClick={() => setCurrentPage(Page.Chatbot)}
                                />
                            </nav>
                            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800">
                                {isDarkMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </header>
                
                <main className="pb-20 sm:pb-0">
                    {renderPage()}
                </main>

                {/* Bottom navigation for mobile */}
                <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 p-2 flex justify-around">
                     <NavItem
                        icon={<DashboardIcon className="h-6 w-6 mx-auto"/>}
                        label="Dashboard"
                        isActive={currentPage === Page.Dashboard}
                        onClick={() => setCurrentPage(Page.Dashboard)}
                    />
                    <NavItem
                        icon={<CalendarIcon className="h-6 w-6 mx-auto"/>}
                        label="Weekly"
                        isActive={currentPage === Page.WeeklyView}
                        onClick={() => setCurrentPage(Page.WeeklyView)}
                    />
                    <NavItem
                        icon={<ChatIcon className="h-6 w-6 mx-auto"/>}
                        label="AI Chat"
                        isActive={currentPage === Page.Chatbot}
                        onClick={() => setCurrentPage(Page.Chatbot)}
                    />
                </nav>
            </div>
        </AppContext.Provider>
    );
};

export default App;