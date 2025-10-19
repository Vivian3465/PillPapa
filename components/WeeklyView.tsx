import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { Reminder } from '../types';
import { CheckIcon, XMarkIcon, PillIcon, TabletIcon, CapsuleIcon, LiquidIcon, InhalerIcon, AnimatedCheckIcon } from './icons';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const medicationIcons: { [key: string]: React.FC<{ className?: string }> } = {
    'pill': PillIcon,
    'tablet': TabletIcon,
    'capsule': CapsuleIcon,
    'liquid': LiquidIcon,
    'inhaler': InhalerIcon,
};

const ReminderModal: React.FC<{
    medicineId: string;
    onClose: () => void;
    onAddReminder: (reminder: Omit<Reminder, 'id' | 'medicineName'>) => void;
}> = ({ medicineId, onClose, onAddReminder }) => {
    const [day, setDay] = useState(new Date().getDay());
    const [time, setTime] = useState('08:00');

    const handleAdd = () => {
        onAddReminder({ medicineId, day, time });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-800 p-6 w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Add Reminder</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="day" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Day</label>
                        <select
                            id="day"
                            value={day}
                            onChange={(e) => setDay(parseInt(e.target.value, 10))}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                        >
                            {daysOfWeek.map((d, i) => <option key={i} value={i}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="time" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Time</label>
                        <input
                            type="time"
                            id="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">Cancel</button>
                    <button onClick={handleAdd} className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600">Add</button>
                </div>
            </div>
        </div>
    );
};


const WeeklyView: React.FC = () => {
    const { medicines, reminders, addReminder, adherenceLogs, logAdherence } = useContext(AppContext);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedMedId, setSelectedMedId] = useState<string | null>(null);
    const [animatedReminderId, setAnimatedReminderId] = useState<string | null>(null);

    const todayIndex = new Date().getDay();
    const todayDate = new Date().toISOString().split('T')[0];

    const handleOpenModal = (medicineId: string) => {
        setSelectedMedId(medicineId);
        setModalOpen(true);
    };

    const handleLogAdherence = (reminderId: string, status: 'taken' | 'skipped') => {
        logAdherence(reminderId, status);
        if (status === 'taken') {
            setAnimatedReminderId(reminderId);
            setTimeout(() => setAnimatedReminderId(null), 1500); // Animation duration
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {modalOpen && selectedMedId &&
                <ReminderModal
                    medicineId={selectedMedId}
                    onClose={() => setModalOpen(false)}
                    onAddReminder={addReminder}
                />
            }
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Weekly Reminders</h1>

                <div className="mb-8 p-6 bg-white dark:bg-gray-800/50 rounded-lg border dark:border-gray-800">
                     <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Set a Reminder</h2>
                     <p className="text-gray-600 dark:text-gray-300 mb-4">Select one of your medications to add a weekly reminder.</p>
                     {medicines.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                             {medicines.map(med => (
                                 <button
                                     key={med.id}
                                     onClick={() => handleOpenModal(med.id)}
                                     className="px-4 py-2 text-sm font-medium text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-500/20 rounded-full hover:bg-orange-200 dark:hover:bg-orange-500/30 transition-colors"
                                 >{med.name}</button>
                             ))}
                         </div>
                     ) : (
                         <p className="text-sm text-gray-500 dark:text-gray-400">You need to add a medication on the Dashboard first.</p>
                     )}
                 </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                    {daysOfWeek.map((day, index) => {
                        const dayReminders = reminders.filter(r => r.day === index).sort((a, b) => a.time.localeCompare(b.time));
                        return (
                            <div key={day} className={`rounded-lg p-4 ${index === todayIndex ? 'bg-orange-500/10 dark:bg-orange-500/20 border-2 border-orange-500' : 'bg-white dark:bg-gray-800/50 border dark:border-gray-800'}`}>
                                <h3 className="font-bold text-center text-gray-800 dark:text-gray-100">{day}</h3>
                                <div className="mt-4 space-y-3">
                                    {dayReminders.length > 0 ? dayReminders.map(reminder => {
                                        const medicine = medicines.find(m => m.id === reminder.medicineId);
                                        const Icon = medicine?.icon ? medicationIcons[medicine.icon] : PillIcon;
                                        const log = index === todayIndex ? adherenceLogs.find(l => l.reminderId === reminder.id && l.date === todayDate) : null;
                                        const isAnimating = animatedReminderId === reminder.id;
                                        return (
                                        <div key={reminder.id} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md relative">
                                            {isAnimating && (
                                                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10">
                                                    <AnimatedCheckIcon />
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center space-x-2">
                                                    <Icon className="h-5 w-5 text-orange-500 flex-shrink-0" />
                                                    <div>
                                                        <p className="font-semibold text-sm text-gray-700 dark:text-gray-200">{reminder.medicineName}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{reminder.time}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {index === todayIndex && (
                                                <div className="mt-2">
                                                    {log ? (
                                                        <div className={`flex items-center justify-center text-xs font-bold p-1 rounded ${log.status === 'taken' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'}`}>
                                                            {log.status === 'taken' ? <CheckIcon className="h-4 w-4 mr-1"/> : <XMarkIcon className="h-4 w-4 mr-1"/>}
                                                            {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button onClick={() => handleLogAdherence(reminder.id, 'taken')} className="flex items-center justify-center text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-500/20 rounded hover:bg-green-200 dark:hover:bg-green-500/30 p-1">
                                                                <CheckIcon className="h-4 w-4 mr-1"/> Take
                                                            </button>
                                                            <button onClick={() => handleLogAdherence(reminder.id, 'skipped')} className="flex items-center justify-center text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-500/20 rounded hover:bg-red-200 dark:hover:bg-red-500/30 p-1">
                                                                <XMarkIcon className="h-4 w-4 mr-1"/> Skip
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}) : (
                                        <p className="text-center text-xs text-gray-400 dark:text-gray-500 pt-4">No reminders</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WeeklyView;