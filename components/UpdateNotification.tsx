import React, { useEffect, useState } from 'react';

const UpdateNotification: React.FC = () => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Check if running in electron
        // @ts-ignore
        if (window.electron && window.electron.ipcRenderer) {
            // @ts-ignore
            const removeUpdateListener = window.electron.ipcRenderer.on('update_available', () => {
                setUpdateAvailable(true);
                // Pulse o sininho ou algo assim visualmente
            });
            // @ts-ignore
            const removeErrorListener = window.electron.ipcRenderer.on('update_error', (msg: string) => {
                setErrorMessage(msg);
                console.error("ERRO DE UPDATE RECEBIDO NO FRONTEND:", msg);
            });

            return () => {
                if (removeUpdateListener) removeUpdateListener();
                if (removeErrorListener) removeErrorListener();
            };
        }
    }, []);

    const handleUpdate = () => {
        setIsDownloading(true);
        // @ts-ignore
        window.electron.ipcRenderer.send('start_download_update');
    };

    if (errorMessage) {
        return (
            <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-[9999] max-w-sm animate-bounce">
                <strong className="font-bold block mb-1">Erro na Atualização</strong>
                <span className="block sm:inline text-sm">{errorMessage}</span>
                <button
                    onClick={() => setErrorMessage('')}
                    className="absolute top-0 bottom-0 right-0 px-4 py-3"
                >
                    <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" /></svg>
                </button>
            </div>
        );
    }

    if (!updateAvailable) return null;

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setShowDialog(!showDialog)}
                className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                title="Nova atualização disponível"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                {/* Red Dot */}
                <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            </button>

            {/* Dialog / Popover */}
            {showDialog && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                    {isDownloading ? (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-3"></div>
                            <h3 className="font-bold text-gray-800">Baixando atualização...</h3>
                            <p className="text-xs text-gray-500 mt-1">
                                O app será reiniciado automaticamente.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-start gap-3 mb-4">
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-600">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-sm">Nova Versão Disponível</h3>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        Uma nova versão com melhorias e correções está pronta para instalação.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowDialog(false)}
                                    className="flex-1 px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    AGORA NÃO
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    className="flex-1 px-3 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md shadow-green-100 transition-all"
                                >
                                    ATUALIZAR
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
export default UpdateNotification;
