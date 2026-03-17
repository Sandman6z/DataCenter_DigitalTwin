export const CONFIG = {
  PORT: process.env.PORT || 3002,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/datacenter-dt',
  MQTT: {
    BROKER: process.env.MQTT_BROKER || 'mqtt://localhost',
    PORT: parseInt(process.env.MQTT_PORT || '1883'),
    TOPIC: process.env.MQTT_TOPIC || 'datacenter/sensors',
    USERNAME: process.env.MQTT_USERNAME || 'admin',
    PASSWORD: process.env.MQTT_PASSWORD || 'admin123',
    CLIENT_ID: `mqtt-client-${Math.random().toString(16).substring(2, 10)}`
  },
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};
