from scapy.all import rdpcap, IP, TCP, UDP, Raw
from typing import Dict, List, Tuple, Optional
from models import AppType, Flow, AnalysisReport
from dpi_engine import SNIExtractor, AppClassifier, RuleEngine
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class PcapAnalyzer:
    def __init__(self, pcap_path: str, capture_id: str, rules: List[Dict] = None):
        self.pcap_path = pcap_path
        self.capture_id = capture_id
        self.flows: Dict[Tuple, Dict] = {}
        self.rule_engine = RuleEngine(rules or [])
        self.stats = {
            'total_packets': 0,
            'total_bytes': 0,
            'tcp_packets': 0,
            'udp_packets': 0,
            'forwarded': 0,
            'dropped': 0,
            'app_breakdown': {},
            'detected_domains': set()
        }
    
    def analyze(self) -> Tuple[List[Flow], AnalysisReport]:
        """Analyze PCAP file and return flows and report"""
        try:
            logger.info(f"Starting analysis of {self.pcap_path}")
            packets = rdpcap(self.pcap_path)
            logger.info(f"Loaded {len(packets)} packets")
            
            for i, packet in enumerate(packets):
                self._process_packet(packet)
                if (i + 1) % 100 == 0:
                    logger.info(f"Processed {i + 1} packets")
            
            # Convert flows to Flow objects
            flow_list = self._create_flow_list()
            
            # Create analysis report
            report = self._create_report()
            
            logger.info(f"Analysis complete: {len(flow_list)} flows, {self.stats['total_packets']} packets")
            return flow_list, report
        
        except Exception as e:
            logger.error(f"Error analyzing PCAP: {e}", exc_info=True)
            raise
    
    def _process_packet(self, packet):
        """Process a single packet"""
        self.stats['total_packets'] += 1
        self.stats['total_bytes'] += len(packet)
        
        # Check if packet has IP layer
        if not packet.haslayer(IP):
            return
        
        ip_layer = packet[IP]
        src_ip = ip_layer.src
        dst_ip = ip_layer.dst
        
        # Get transport layer info
        if packet.haslayer(TCP):
            tcp_layer = packet[TCP]
            src_port = tcp_layer.sport
            dst_port = tcp_layer.dport
            protocol = 'TCP'
            self.stats['tcp_packets'] += 1
        elif packet.haslayer(UDP):
            udp_layer = packet[UDP]
            src_port = udp_layer.sport
            dst_port = udp_layer.dport
            protocol = 'UDP'
            self.stats['udp_packets'] += 1
        else:
            return
        
        # Create 5-tuple key
        five_tuple = (src_ip, dst_ip, src_port, dst_port, protocol)
        
        # Get or create flow
        if five_tuple not in self.flows:
            self.flows[five_tuple] = {
                'src_ip': src_ip,
                'dst_ip': dst_ip,
                'src_port': src_port,
                'dst_port': dst_port,
                'protocol': protocol,
                'app_type': AppType.UNKNOWN,
                'sni': None,
                'packet_count': 0,
                'byte_count': 0,
                'blocked': False,
                'first_seen': datetime.utcnow(),
                'last_seen': datetime.utcnow()
            }
        
        flow = self.flows[five_tuple]
        flow['packet_count'] += 1
        flow['byte_count'] += len(packet)
        flow['last_seen'] = datetime.utcnow()
        
        # Try to extract SNI if not already found
        if flow['sni'] is None and packet.haslayer(Raw):
            payload = bytes(packet[Raw].load)
            
            # Try TLS (port 443)
            if dst_port == 443 or src_port == 443:
                sni = SNIExtractor.extract_from_tls(payload)
                if sni:
                    flow['sni'] = sni
                    self.stats['detected_domains'].add(sni)
                    flow['app_type'] = AppClassifier.classify(sni, dst_port)
            
            # Try HTTP (port 80)
            elif dst_port == 80 or src_port == 80:
                host = SNIExtractor.extract_from_http(payload)
                if host:
                    flow['sni'] = host
                    self.stats['detected_domains'].add(host)
                    flow['app_type'] = AppClassifier.classify(host, dst_port)
        
        # Classify if not yet classified
        if flow['app_type'] == AppType.UNKNOWN:
            flow['app_type'] = AppClassifier.classify(flow['sni'], dst_port)
        
        # Check blocking rules (only check once per flow)
        if not flow.get('checked_rules', False):
            flow['blocked'] = self.rule_engine.is_blocked(
                src_ip, 
                flow['app_type'], 
                flow['sni']
            )
            flow['checked_rules'] = True
        
        # Update stats
        if flow['blocked']:
            self.stats['dropped'] += 1
        else:
            self.stats['forwarded'] += 1
        
        # Update app breakdown
        app_name = flow['app_type'].value
        self.stats['app_breakdown'][app_name] = self.stats['app_breakdown'].get(app_name, 0) + 1
    
    def _create_flow_list(self) -> List[Flow]:
        """Convert internal flow dict to Flow objects"""
        flow_list = []
        for five_tuple, flow_data in self.flows.items():
            flow = Flow(
                capture_id=self.capture_id,
                src_ip=flow_data['src_ip'],
                dst_ip=flow_data['dst_ip'],
                src_port=flow_data['src_port'],
                dst_port=flow_data['dst_port'],
                protocol=flow_data['protocol'],
                app_type=flow_data['app_type'],
                sni=flow_data['sni'],
                packet_count=flow_data['packet_count'],
                byte_count=flow_data['byte_count'],
                blocked=flow_data['blocked'],
                first_seen=flow_data['first_seen'],
                last_seen=flow_data['last_seen']
            )
            flow_list.append(flow)
        return flow_list
    
    def _create_report(self) -> AnalysisReport:
        """Create analysis report"""
        return AnalysisReport(
            capture_id=self.capture_id,
            total_packets=self.stats['total_packets'],
            total_bytes=self.stats['total_bytes'],
            tcp_packets=self.stats['tcp_packets'],
            udp_packets=self.stats['udp_packets'],
            forwarded=self.stats['forwarded'],
            dropped=self.stats['dropped'],
            app_breakdown=self.stats['app_breakdown'],
            detected_domains=sorted(list(self.stats['detected_domains']))
        )
