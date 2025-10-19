import React, { useState, useRef, useContext, useMemo } from 'react';
import { Medicine } from '../types';
import { AppContext } from '../App';
import { getMedicineInfoFromImage, getMedicineInfoFromText } from '../services/geminiService';
import { CameraIcon, PillIcon, TabletIcon, CapsuleIcon, LiquidIcon, InhalerIcon } from './icons';

const medicationIcons: { [key: string]: React.FC<{ className?: string }> } = {
    'pill': PillIcon,
    'tablet': TabletIcon,
    'capsule': CapsuleIcon,
    'liquid': LiquidIcon,
    'inhaler': InhalerIcon,
};

const IconSelectionModal: React.FC<{
    onSelect: (icon: string) => void;
    onClose: () => void;
}> = ({ onSelect, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-800 p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Select an Icon</h2>
                <div className="grid grid-cols-3 gap-4">
                    {Object.entries(medicationIcons).map(([key, Icon]) => (
                        <button
                            key={key}
                            onClick={() => onSelect(key)}
                            className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
                        >
                            <Icon className="h-10 w-10 text-orange-500" />
                            <span className="mt-2 text-sm font-medium capitalize text-gray-700 dark:text-gray-300">{key}</span>
                        </button>
                    ))}
                </div>
                <button onClick={onClose} className="mt-6 w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
                    Cancel
                </button>
            </div>
        </div>
    );
};


interface MedicineCardProps {
  medicine: Medicine;
}

const MedicineCard: React.FC<MedicineCardProps> = ({ medicine }) => {
    const { reminders, adherenceLogs } = useContext(AppContext);

    const skippedCount = useMemo(() => {
        const medicineReminderIds = new Set(
            reminders.filter(r => r.medicineId === medicine.id).map(r => r.id)
        );
        return adherenceLogs.filter(log =>
            medicineReminderIds.has(log.reminderId) && log.status === 'skipped'
        ).length;
    }, [reminders, adherenceLogs, medicine.id]);
    
    const Icon = medicine.icon ? medicationIcons[medicine.icon] : PillIcon;

    return (
    <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-transparent dark:border-gray-800 overflow-hidden transition-all duration-300 hover:dark:border-orange-500/50">
        <div className="p-6">
            <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                        <div className="bg-orange-100 dark:bg-orange-500/20 p-3 rounded-full">
                            <Icon className="h-6 w-6 text-orange-500" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{medicine.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Dosage: {medicine.dosage}</p>
                    </div>
                </div>
                {skippedCount > 0 && (
                     <div className="text-xs font-bold text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-500/20 px-2 py-1 rounded-full">
                        Skipped: {skippedCount}
                    </div>
                )}
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">{medicine.description}</p>
            <div className="mt-4">
                <h4 className="font-semibold text-gray-700 dark:text-gray-200">Interactions to Avoid:</h4>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-red-500 dark:text-red-400">
                    {medicine.interactions.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            </div>
        </div>
    </div>
)};

const Dashboard: React.FC = () => {
    const { medicines, addMedicine } = useContext(AppContext);
    const [drugName, setDrugName] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingMedicine, setPendingMedicine] = useState<Omit<Medicine, 'id' | 'icon'> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fileToBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (err) => reject(err);
      });

    const handleFetchMedicineInfo = async () => {
        if (!drugName && !selectedFile) {
            setError('Please enter a drug name or upload a picture.');
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            let medInfo: Omit<Medicine, 'id' | 'imageUrl' | 'icon'>;
            if (selectedFile) {
                const base64Image = await fileToBase64(selectedFile);
                medInfo = await getMedicineInfoFromImage(base64Image, selectedFile.type);
            } else {
                medInfo = await getMedicineInfoFromText(drugName);
            }
            setPendingMedicine(medInfo);
        } catch (err) {
            console.error(err);
            setError('Could not retrieve medicine information. Please try again.');
            setIsLoading(false);
        }
    };

    const handleIconSelected = (icon: string) => {
        if (pendingMedicine) {
             const newMedicine: Medicine = {
                ...pendingMedicine,
                id: Date.now().toString(),
                icon: icon,
            };
            addMedicine(newMedicine);
            resetForm();
        }
    };
    
    const resetForm = () => {
        setDrugName('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsLoading(false);
        setPendingMedicine(null);
        setError(null);
    };
    
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            {pendingMedicine && (
                <IconSelectionModal 
                    onSelect={handleIconSelected}
                    onClose={resetForm}
                />
            )}
            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border dark:border-gray-800">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Add a New Medication</h2>
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={drugName}
                            onChange={(e) => setDrugName(e.target.value)}
                            placeholder="Enter medicine name (e.g., Ibuprofen)"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            disabled={isLoading}
                        />
                        <div className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400">OR</div>
                        <label className="flex justify-center items-center w-full px-4 py-6 bg-gray-50 dark:bg-gray-900/50 text-orange-600 dark:text-orange-400 rounded-lg tracking-wide uppercase border-2 border-dashed border-gray-300 dark:border-gray-700 cursor-pointer hover:bg-orange-100 dark:hover:bg-gray-800">
                            <CameraIcon className="w-8 h-8 mr-2"/>
                            <span className="text-base leading-normal">{selectedFile ? selectedFile.name : 'Upload a picture'}</span>
                            <input
                                ref={fileInputRef}
                                type='file'
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                                disabled={isLoading}
                            />
                        </label>
                         <button
                            onClick={handleFetchMedicineInfo}
                            disabled={isLoading}
                            className="w-full flex justify-center items-center bg-orange-500 text-white font-bold py-3 px-4 rounded-md hover:bg-orange-600 disabled:bg-orange-300 dark:disabled:bg-orange-500/30 disabled:cursor-not-allowed transition-colors duration-300"
                        >
                            {isLoading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : "Add Medicine"}
                        </button>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Your Medications</h2>
                {medicines.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {medicines.map(med => <MedicineCard key={med.id} medicine={med} />)}
                    </div>
                ) : (
                    <div className="text-center py-16 px-6 bg-white dark:bg-gray-800/50 rounded-lg border dark:border-gray-800">
                        <PillIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-800 dark:text-gray-100">No Medications Added</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Use the form above to add your first medication.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;