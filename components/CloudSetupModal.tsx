import React, { useState } from 'react';
import { useAttendance } from '../contexts/AttendanceContext';
import { Database, X, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
    onClose: () => void;
}

const CloudSetupModal: React.FC<Props> = ({ onClose }) => {
    const { connectCloud, jsonBinConfig, disconnectCloud, cloudStatus, cloudError } = useAttendance();
    const [binId, setBinId] = useState(jsonBinConfig?.binId || '');
    const [apiKey, setApiKey] = useState(jsonBinConfig?.apiKey || '');
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState('');

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        setLoading(true);
        try {
            await connectCloud(binId.trim(), apiKey.trim());
            onClose();
        } catch (e: any) {
            setLocalError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = () => {
        if(confirm('确定要断开数据库连接吗？后续数据将不再自动同步。')) {
            disconnectCloud();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-600" />
                        连接云端数据同步
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-600">
                    <p className="mb-2 font-medium">如何连接：</p>
                    <p>如果老师已经配置好，请直接扫描老师提供的<strong>“带参数二维码”</strong>即可自动连接。</p>
                    <p className="mt-2 text-xs text-slate-400">或者手动输入下方信息：</p>
                </div>

                {jsonBinConfig ? (
                     <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-start gap-3">
                            <div className="bg-green-100 p-1 rounded-full text-green-600 mt-0.5">
                                <Check className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-green-800 font-bold text-sm">已连接到数据库</p>
                                <p className="text-green-700 text-xs mt-1 break-all">ID: {jsonBinConfig.binId}</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleDisconnect}
                            className="w-full border border-red-200 text-red-600 hover:bg-red-50 font-bold py-3 rounded-xl transition-colors"
                        >
                            断开连接
                        </button>
                     </div>
                ) : (
                    <form onSubmit={handleConnect} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Bin ID</label>
                            <input 
                                type="text" 
                                value={binId}
                                onChange={(e) => setBinId(e.target.value)}
                                placeholder="例如: 65d4f..."
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 font-mono text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">API Key (Master Key)</label>
                            <input 
                                type="password" 
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="$2a$10$..."
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 font-mono text-sm"
                            />
                        </div>
                        
                        {(localError || cloudError) && (
                            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {localError || cloudError}
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={loading || !binId || !apiKey}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                            {loading ? '连接中...' : '确认连接'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CloudSetupModal;