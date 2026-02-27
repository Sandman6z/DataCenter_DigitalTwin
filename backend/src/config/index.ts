export const CONFIG = {
  PORT: process.env.PORT || 3002,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/datacenter-dt',
  MQTT: {
    BROKER: process.env.MQTT_BROKER || 'mqtt://localhost',
    PORT: parseInt(process.env.MQTT_PORT || '1883'),
    TOPIC: process.env.MQTT_TOPIC || 'datacenter/sensors',
  },
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};
