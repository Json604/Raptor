import { useEffect, useState } from "react";
import './MonitoringDashboard.css';
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { 
    Activity, 
    Globe, 
    AlertTriangle, 
    Clock, 
    Users,
    MapPin,
    CheckCircle2,
    XCircle,
    TrendingUp
} from 'lucide-react';

export default function MonitoringDashboard() {
    const navigate = useNavigate();
    const [securityLevel, setSecurityLevel] = useState(85);
    const [alerts, setAlerts] = useState([
        { id: 1, type: 'warning', message: 'Possible DDoS attempt detected', time: '2 minutes ago', new: true },
        { id: 2, type: 'info', message: 'New user flagged for suspicious activity', time: '15 minutes ago', new: true },
        { id: 3, type: 'success', message: 'Vulnerability patch applied successfully', time: '1 hour ago', new: false },
        { id: 4, type: 'warning', message: 'Unusual traffic spike from unknown region', time: '2 hours ago', new: false },
    ]);
    setSecurityLevel(85);
    setAlerts([])


    const [liveStats, setLiveStats] = useState({
        activeUsers: 1247,
        threats: 3,
        uptime: 99.8,
        lastIncident: '3 days ago'
    });

    const threatRegions = [
        { region: 'Eastern Europe', level: 'High', count: 12 },
        { region: 'Southeast Asia', level: 'Medium', count: 7 },
        { region: 'South America', level: 'Low', count: 3 },
    ];

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, []);

    // Simulate live updates
    useEffect(() => {
        const interval = setInterval(() => {
            setLiveStats(prev => ({
                ...prev,
                activeUsers: prev.activeUsers + Math.floor(Math.random() * 10 - 5)
            }));
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const getSecurityColor = () => {
        if (securityLevel >= 80) return '#10b981';
        if (securityLevel >= 60) return '#f59e0b';
        return '#ef4444';
    };

    const getThreatColor = (level: string) => {
        switch(level.toLowerCase()) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    return (
        <>
            <Navbar />
            <div className="monitoring-container">
                {/* Header */}
                <div className="dashboard-header fade-in">
                    <div className="header-content">
                        <h1 className="dashboard-title">Monitoring Dashboard</h1>
                        <p className="dashboard-subtitle">Real-time security monitoring & threat detection</p>
                    </div>
                    <button className="back-button" onClick={() => navigate('/results')}>
                        ← Back to Results
                    </button>
                </div>

                {/* Security Zone - Main Feature */}
                <div className="security-zone fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="zone-header">
                        <h2 className="zone-title">Security Zone</h2>
                        <div className="zone-status">
                            <div className="status-dot" style={{ background: getSecurityColor() }}></div>
                            <span className="status-text">
                                {securityLevel >= 80 ? 'Protected' : securityLevel >= 60 ? 'Moderate' : 'At Risk'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="zone-content">
                        <div className="security-gauge">
                            <svg viewBox="0 0 200 120" className="gauge-svg">
                                {/* Background arc */}
                                <path
                                    d="M 20 100 A 80 80 0 0 1 180 100"
                                    fill="none"
                                    stroke="rgba(255, 255, 255, 0.1)"
                                    strokeWidth="20"
                                    strokeLinecap="round"
                                />
                                {/* Colored arc */}
                                <path
                                    d="M 20 100 A 80 80 0 0 1 180 100"
                                    fill="none"
                                    stroke={getSecurityColor()}
                                    strokeWidth="20"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(securityLevel / 100) * 251.2} 251.2`}
                                    style={{ transition: 'stroke-dasharray 1s ease' }}
                                />
                            </svg>
                            <div className="gauge-value">
                                <span className="gauge-number" style={{ color: getSecurityColor() }}>{securityLevel}</span>
                                <span className="gauge-label">Security Score</span>
                            </div>
                        </div>
                        
                        <div className="zone-info">
                            <p className="zone-description">
                                Your application is currently <strong style={{ color: getSecurityColor() }}>
                                {securityLevel >= 80 ? 'well protected' : securityLevel >= 60 ? 'moderately secure' : 'vulnerable'}
                                </strong>. 
                                Raptor is actively monitoring for threats and unusual activity.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="stat-card users-card">
                        <div className="stat-icon">
                            <Users size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{liveStats.activeUsers.toLocaleString()}</div>
                            <div className="stat-label">Live User Activity</div>
                            <div className="stat-badge live">
                                <Activity size={12} className="pulse-icon" />
                                <span>Live</span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card threats-card">
                        <div className="stat-icon alert">
                            <AlertTriangle size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{liveStats.threats}</div>
                            <div className="stat-label">Active Threats</div>
                            <div className="stat-trend">
                                <TrendingUp size={12} />
                                <span>+2 today</span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card uptime-card">
                        <div className="stat-icon success">
                            <CheckCircle2 size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{liveStats.uptime}%</div>
                            <div className="stat-label">Uptime Status</div>
                            <div className="stat-meta">Last 30 days</div>
                        </div>
                    </div>

                    <div className="stat-card incident-card">
                        <div className="stat-icon">
                            <Clock size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{liveStats.lastIncident}</div>
                            <div className="stat-label">Last Incident Detected</div>
                            <div className="stat-meta">SQL injection attempt</div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="content-grid fade-in" style={{ animationDelay: '0.3s' }}>
                    {/* Threat Regions */}
                    <div className="threat-regions-card">
                        <div className="card-header">
                            <MapPin size={20} />
                            <h3 className="card-title">Potential Threat Regions</h3>
                        </div>
                        <div className="regions-list">
                            {threatRegions.map((region, index) => (
                                <div key={index} className="region-item">
                                    <div className="region-info">
                                        <Globe size={16} />
                                        <span className="region-name">{region.region}</span>
                                    </div>
                                    <div className="region-stats">
                                        <span className="region-count">{region.count} threats</span>
                                        <span 
                                            className="region-level"
                                            style={{ 
                                                background: `${getThreatColor(region.level)}15`,
                                                color: getThreatColor(region.level),
                                                border: `1px solid ${getThreatColor(region.level)}30`
                                            }}
                                        >
                                            {region.level}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="region-chart">
                            <div className="chart-bars">
                                {threatRegions.map((region, index) => (
                                    <div key={index} className="chart-bar-container">
                                        <div 
                                            className="chart-bar"
                                            style={{
                                                width: `${(region.count / 12) * 100}%`,
                                                background: getThreatColor(region.level)
                                            }}
                                        ></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Live Alerts */}
                    <div className="alerts-card">
                        <div className="card-header">
                            <Activity size={20} />
                            <h3 className="card-title">Live Alert Feed</h3>
                        </div>
                        <div className="alerts-list">
                            {alerts.map((alert) => (
                                <div key={alert.id} className={`alert-item ${alert.type} ${alert.new ? 'new' : ''}`}>
                                    <div className="alert-icon">
                                        {alert.type === 'warning' && <AlertTriangle size={18} />}
                                        {alert.type === 'info' && <Activity size={18} />}
                                        {alert.type === 'success' && <CheckCircle2 size={18} />}
                                        {alert.type === 'error' && <XCircle size={18} />}
                                    </div>
                                    <div className="alert-content">
                                        <div className="alert-message">{alert.message}</div>
                                        <div className="alert-time">{alert.time}</div>
                                    </div>
                                    {alert.new && <div className="alert-badge">New</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                
            </div>
        </>
    );
}

