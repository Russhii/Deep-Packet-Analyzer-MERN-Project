import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import pickle
import os
from typing import Dict, List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class TrafficCategory:
    """Traffic categories for ML classification"""
    VIDEO_STREAMING = "Video Streaming"
    SOCIAL_MEDIA = "Social Media"
    WEB_BROWSING = "Web Browsing"
    FILE_TRANSFER = "File Transfer"
    GAMING = "Gaming"
    VOIP_AUDIO = "VoIP/Audio"
    EMAIL = "Email"
    MESSAGING = "Messaging"
    P2P = "P2P/Torrent"
    UNKNOWN = "Unknown"

class MLTrafficClassifier:
    """Machine Learning based traffic classifier"""
    
    def __init__(self):
        self.model: Optional[RandomForestClassifier] = None
        self.scaler: Optional[StandardScaler] = None
        self.feature_names = [
            'packet_count',
            'byte_count',
            'avg_packet_size',
            'std_packet_size',
            'min_packet_size',
            'max_packet_size',
            'flow_duration',
            'packets_per_second',
            'bytes_per_second',
            'dst_port',
            'is_tcp',
            'is_udp'
        ]
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize or load pre-trained model"""
        model_path = '/app/backend/ml_model.pkl'
        scaler_path = '/app/backend/ml_scaler.pkl'
        
        if os.path.exists(model_path) and os.path.exists(scaler_path):
            try:
                with open(model_path, 'rb') as f:
                    self.model = pickle.load(f)
                with open(scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                logger.info("Loaded pre-trained ML model")
            except Exception as e:
                logger.warning(f"Could not load model: {e}. Creating new model.")
                self._create_pretrained_model()
        else:
            self._create_pretrained_model()
    
    def _create_pretrained_model(self):
        """Create a pre-trained model with synthetic data"""
        logger.info("Creating pre-trained ML model with synthetic data")
        
        # Generate synthetic training data based on known traffic patterns
        X_train, y_train = self._generate_synthetic_training_data()
        
        # Train the model
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X_train)
        
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        self.model.fit(X_scaled, y_train)
        
        # Save the model
        try:
            with open('/app/backend/ml_model.pkl', 'wb') as f:
                pickle.dump(self.model, f)
            with open('/app/backend/ml_scaler.pkl', 'wb') as f:
                pickle.dump(self.scaler, f)
            logger.info("Saved pre-trained ML model")
        except Exception as e:
            logger.error(f"Could not save model: {e}")
    
    def _generate_synthetic_training_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """Generate synthetic training data based on typical traffic patterns"""
        np.random.seed(42)
        samples = []
        labels = []
        
        # Video Streaming (YouTube, Netflix) - Large packets, high throughput, long duration
        for _ in range(200):
            samples.append([
                np.random.randint(100, 500),  # packet_count
                np.random.randint(100000, 5000000),  # byte_count
                np.random.randint(1000, 1500),  # avg_packet_size
                np.random.randint(200, 500),  # std_packet_size
                np.random.randint(60, 200),  # min_packet_size
                np.random.randint(1400, 1500),  # max_packet_size
                np.random.uniform(10, 300),  # flow_duration
                np.random.uniform(10, 50),  # packets_per_second
                np.random.uniform(50000, 500000),  # bytes_per_second
                443,  # dst_port (HTTPS)
                1,  # is_tcp
                0   # is_udp
            ])
            labels.append(TrafficCategory.VIDEO_STREAMING)
        
        # Social Media (Facebook, Instagram) - Medium packets, bursty
        for _ in range(200):
            samples.append([
                np.random.randint(20, 150),
                np.random.randint(10000, 500000),
                np.random.randint(300, 1000),
                np.random.randint(100, 400),
                np.random.randint(60, 100),
                np.random.randint(1000, 1500),
                np.random.uniform(5, 60),
                np.random.uniform(5, 30),
                np.random.uniform(5000, 100000),
                443,
                1,
                0
            ])
            labels.append(TrafficCategory.SOCIAL_MEDIA)
        
        # Web Browsing - Small to medium packets, short duration
        for _ in range(200):
            samples.append([
                np.random.randint(5, 50),
                np.random.randint(1000, 100000),
                np.random.randint(200, 800),
                np.random.randint(50, 300),
                np.random.randint(60, 100),
                np.random.randint(500, 1500),
                np.random.uniform(1, 30),
                np.random.uniform(2, 20),
                np.random.uniform(1000, 50000),
                np.random.choice([80, 443]),
                1,
                0
            ])
            labels.append(TrafficCategory.WEB_BROWSING)
        
        # File Transfer - Very large, consistent packet sizes
        for _ in range(200):
            samples.append([
                np.random.randint(500, 2000),
                np.random.randint(1000000, 10000000),
                np.random.randint(1400, 1500),
                np.random.randint(10, 50),
                np.random.randint(1300, 1400),
                1500,
                np.random.uniform(30, 600),
                np.random.uniform(20, 100),
                np.random.uniform(100000, 1000000),
                np.random.choice([21, 22, 443, 8080]),
                1,
                0
            ])
            labels.append(TrafficCategory.FILE_TRANSFER)
        
        # Gaming - Small packets, very frequent, UDP often
        for _ in range(200):
            samples.append([
                np.random.randint(100, 500),
                np.random.randint(5000, 50000),
                np.random.randint(50, 200),
                np.random.randint(20, 80),
                np.random.randint(40, 60),
                np.random.randint(100, 300),
                np.random.uniform(60, 600),
                np.random.uniform(10, 60),
                np.random.uniform(1000, 20000),
                np.random.randint(20000, 65000),
                np.random.choice([0, 1]),
                np.random.choice([0, 1])
            ])
            labels.append(TrafficCategory.GAMING)
        
        # VoIP/Audio - Small, consistent packets, UDP
        for _ in range(200):
            samples.append([
                np.random.randint(50, 300),
                np.random.randint(5000, 100000),
                np.random.randint(100, 300),
                np.random.randint(10, 50),
                np.random.randint(80, 120),
                np.random.randint(200, 350),
                np.random.uniform(30, 600),
                np.random.uniform(30, 60),
                np.random.uniform(8000, 64000),
                np.random.choice([5060, 5061, 16384]),
                0,
                1
            ])
            labels.append(TrafficCategory.VOIP_AUDIO)
        
        # Messaging - Very small packets, infrequent
        for _ in range(100):
            samples.append([
                np.random.randint(5, 30),
                np.random.randint(500, 5000),
                np.random.randint(100, 300),
                np.random.randint(20, 100),
                np.random.randint(60, 80),
                np.random.randint(200, 500),
                np.random.uniform(1, 60),
                np.random.uniform(1, 10),
                np.random.uniform(100, 5000),
                443,
                1,
                0
            ])
            labels.append(TrafficCategory.MESSAGING)
        
        X = np.array(samples)
        y = np.array(labels)
        
        logger.info(f"Generated {len(X)} synthetic training samples")
        return X, y
    
    def extract_features(self, flow_data: Dict) -> np.ndarray:
        """Extract features from a flow for classification"""
        packet_count = flow_data.get('packet_count', 1)
        byte_count = flow_data.get('byte_count', 0)
        
        # Calculate derived features
        avg_packet_size = byte_count / packet_count if packet_count > 0 else 0
        
        # Get packet size statistics if available
        packet_sizes = flow_data.get('packet_sizes', [])
        if packet_sizes:
            std_packet_size = np.std(packet_sizes)
            min_packet_size = np.min(packet_sizes)
            max_packet_size = np.max(packet_sizes)
        else:
            std_packet_size = 0
            min_packet_size = avg_packet_size
            max_packet_size = avg_packet_size
        
        # Calculate flow duration and rates
        first_seen = flow_data.get('first_seen')
        last_seen = flow_data.get('last_seen')
        if first_seen and last_seen:
            flow_duration = (last_seen - first_seen).total_seconds()
            flow_duration = max(flow_duration, 0.001)  # Avoid division by zero
        else:
            flow_duration = 1.0
        
        packets_per_second = packet_count / flow_duration
        bytes_per_second = byte_count / flow_duration
        
        # Port and protocol
        dst_port = flow_data.get('dst_port', 0)
        protocol = flow_data.get('protocol', 'TCP')
        is_tcp = 1 if protocol == 'TCP' else 0
        is_udp = 1 if protocol == 'UDP' else 0
        
        features = np.array([
            packet_count,
            byte_count,
            avg_packet_size,
            std_packet_size,
            min_packet_size,
            max_packet_size,
            flow_duration,
            packets_per_second,
            bytes_per_second,
            dst_port,
            is_tcp,
            is_udp
        ]).reshape(1, -1)
        
        return features
    
    def classify(self, flow_data: Dict) -> Tuple[str, float, Dict[str, float]]:
        """Classify traffic and return category, confidence, and all probabilities"""
        if self.model is None or self.scaler is None:
            return TrafficCategory.UNKNOWN, 0.0, {}
        
        try:
            # Extract features
            features = self.extract_features(flow_data)
            
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Predict
            prediction = self.model.predict(features_scaled)[0]
            probabilities = self.model.predict_proba(features_scaled)[0]
            
            # Get confidence (max probability)
            confidence = float(np.max(probabilities))
            
            # Get all class probabilities
            classes = self.model.classes_
            prob_dict = {cls: float(prob) for cls, prob in zip(classes, probabilities)}
            
            return prediction, confidence, prob_dict
        
        except Exception as e:
            logger.error(f"Error in ML classification: {e}")
            return TrafficCategory.UNKNOWN, 0.0, {}
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from the trained model"""
        if self.model is None:
            return {}
        
        importances = self.model.feature_importances_
        return {name: float(imp) for name, imp in zip(self.feature_names, importances)}
