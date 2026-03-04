import struct
from typing import Optional, Tuple, Dict, List
from models import AppType
import binascii

class SNIExtractor:
    @staticmethod
    def extract_from_tls(payload: bytes) -> Optional[str]:
        """Extract SNI from TLS Client Hello"""
        try:
            if len(payload) < 43:
                return None
            
            # Check TLS record header
            content_type = payload[0]
            if content_type != 0x16:  # Handshake
                return None
            
            # Check handshake type
            if len(payload) < 6:
                return None
            handshake_type = payload[5]
            if handshake_type != 0x01:  # Client Hello
                return None
            
            # Skip to session ID
            offset = 43
            if offset >= len(payload):
                return None
            
            # Skip session ID
            session_id_len = payload[offset]
            offset += 1 + session_id_len
            
            if offset + 2 > len(payload):
                return None
            
            # Skip cipher suites
            cipher_len = struct.unpack('!H', payload[offset:offset+2])[0]
            offset += 2 + cipher_len
            
            if offset + 1 > len(payload):
                return None
            
            # Skip compression methods
            comp_len = payload[offset]
            offset += 1 + comp_len
            
            if offset + 2 > len(payload):
                return None
            
            # Read extensions length
            ext_len = struct.unpack('!H', payload[offset:offset+2])[0]
            offset += 2
            
            # Search for SNI extension
            ext_end = offset + ext_len
            while offset + 4 <= ext_end and offset + 4 <= len(payload):
                ext_type = struct.unpack('!H', payload[offset:offset+2])[0]
                ext_data_len = struct.unpack('!H', payload[offset+2:offset+4])[0]
                offset += 4
                
                if ext_type == 0x0000:  # SNI extension
                    if offset + 5 <= len(payload):
                        sni_len = struct.unpack('!H', payload[offset+3:offset+5])[0]
                        if offset + 5 + sni_len <= len(payload):
                            sni = payload[offset+5:offset+5+sni_len].decode('utf-8', errors='ignore')
                            return sni
                
                offset += ext_data_len
                if offset > len(payload):
                    break
            
            return None
        except Exception as e:
            return None
    
    @staticmethod
    def extract_from_http(payload: bytes) -> Optional[str]:
        """Extract Host from HTTP request"""
        try:
            text = payload.decode('utf-8', errors='ignore')
            lines = text.split('\r\n')
            
            # Check if it's an HTTP request
            if not any(lines[0].startswith(method) for method in ['GET', 'POST', 'HEAD', 'PUT', 'DELETE']):
                return None
            
            # Find Host header
            for line in lines[1:]:
                if line.lower().startswith('host:'):
                    host = line.split(':', 1)[1].strip()
                    return host
            
            return None
        except Exception:
            return None

class AppClassifier:
    @staticmethod
    def classify(sni: Optional[str], dst_port: int) -> AppType:
        """Classify application based on SNI and port"""
        if not sni:
            if dst_port == 443:
                return AppType.HTTPS
            elif dst_port == 80:
                return AppType.HTTP
            elif dst_port == 53:
                return AppType.DNS
            return AppType.UNKNOWN
        
        sni_lower = sni.lower()
        
        # Application patterns
        if 'youtube' in sni_lower or 'ytimg' in sni_lower or 'googlevideo' in sni_lower:
            return AppType.YOUTUBE
        elif 'facebook' in sni_lower or 'fbcdn' in sni_lower:
            return AppType.FACEBOOK
        elif 'google' in sni_lower or 'gstatic' in sni_lower:
            return AppType.GOOGLE
        elif 'tiktok' in sni_lower:
            return AppType.TIKTOK
        elif 'instagram' in sni_lower or 'cdninstagram' in sni_lower:
            return AppType.INSTAGRAM
        elif 'twitter' in sni_lower or 'twimg' in sni_lower:
            return AppType.TWITTER
        elif 'netflix' in sni_lower or 'nflxvideo' in sni_lower:
            return AppType.NETFLIX
        elif 'amazon' in sni_lower or 'amazonaws' in sni_lower:
            return AppType.AMAZON
        elif 'github' in sni_lower:
            return AppType.GITHUB
        elif 'whatsapp' in sni_lower:
            return AppType.WHATSAPP
        elif dst_port == 443:
            return AppType.HTTPS
        elif dst_port == 80:
            return AppType.HTTP
        
        return AppType.UNKNOWN

class RuleEngine:
    def __init__(self, rules: List[Dict]):
        self.blocked_ips = set()
        self.blocked_apps = set()
        self.blocked_domains = []
        
        for rule in rules:
            if not rule.get('enabled', True):
                continue
            
            rule_type = rule['rule_type']
            value = rule['value']
            
            if rule_type == 'ip':
                self.blocked_ips.add(value)
            elif rule_type == 'app':
                self.blocked_apps.add(value)
            elif rule_type == 'domain':
                self.blocked_domains.append(value.lower())
    
    def is_blocked(self, src_ip: str, app_type: AppType, sni: Optional[str]) -> bool:
        """Check if a flow should be blocked"""
        # Check IP
        if src_ip in self.blocked_ips:
            return True
        
        # Check app
        if app_type.value in self.blocked_apps:
            return True
        
        # Check domain
        if sni:
            sni_lower = sni.lower()
            for domain in self.blocked_domains:
                if domain in sni_lower:
                    return True
        
        return False
