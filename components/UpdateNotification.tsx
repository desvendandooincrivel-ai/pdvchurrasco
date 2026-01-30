import React, { useEffect, useState } from 'react';

const UpdateNotification: React.FC = () => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        // Check if running in electron
        // @ts-ignore
        if (window.electron && window.electron.ipcRenderer) {
            // @ts-ignore
            const removeListener = window.electron.ipcRenderer.on('update_available', () => {
                setUpdateAvailable(true);
            });
            return () => {
                if (removeListener) removeListener();
            };
        }
    }, []);

    const handleUpdate = () => {
        setIsDownloading(true);
        // @ts-ignore
        window.electron.ipcRenderer.send('start_download_update');
        // The app will restart automatically when downloaded as per main process logic
    };

    const handleLater = () => {
        setUpdateAvailable(false);
    };

    if (!updateAvailable) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#2d3748',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            zIndex: 9999,
            maxWidth: '350px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            border: '1px solid #4a5568'
        }}>
            {isDownloading ? (
                <div>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: 600 }}>Baixando atualização...</h3>
                    <p style={{ margin: 0, fontSize: '0.9em', color: '#e2e8f0' }}>
                        O aplicativo será reiniciado automaticamente assim que o download terminar.
                    </p>
                </div>
            ) : (
                <div>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: 600 }}>Nova versão disponível</h3>
                    <p style={{ marginBottom: '15px', color: '#e2e8f0' }}>Uma nova versão do sistema está pronta para ser instalada. Deseja atualizar agora?</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handleUpdate}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                background: '#48bb78',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.9em',
                                fontWeight: 500
                            }}
                        >
                            Atualizar agora
                        </button>
                        <button
                            onClick={handleLater}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                background: '#f56565',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.9em',
                                fontWeight: 500
                            }}
                        >
                            Depois
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UpdateNotification;
