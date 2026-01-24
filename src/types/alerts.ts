
export type AlertType = 'INVENTORY_STOCK' | 'DOCUMENT_EXPIRY' | 'MAINTENANCE_DUE' | 'CUSTOM';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AlertRule {
    id: string;
    type: AlertType;
    name: string;
    enabled: boolean;
    // Condition Parameters
    thresholdDays?: number; // For dates: Report if due in X days
    thresholdValue?: number; // For quantities: Report if <= X
    categoryFilter?: string[]; // Apply only to specific categories (e.g., 'EPP', 'VEHICULOS')

    // Notification
    severity: AlertSeverity;
    messageTemplate: string; // e.g., "El vehículo {item} vence SOAT en {days} días"
}

export interface AlertNotification {
    id: string;
    ruleId: string;
    itemId: string;
    itemType: 'INVENTARIO' | 'VEHICULO' | 'FACTURA' | 'DOTACION' | 'EMPLEADO';
    message: string;
    dateGenerated: Date;
    severity: AlertSeverity;
    isRead: boolean;
    actionLink?: string; // URL to resolve the issue
    metadata?: any;
}

export interface AlertsState {
    rules: AlertRule[];
    notifications: AlertNotification[];
    unreadCount: number;
}
