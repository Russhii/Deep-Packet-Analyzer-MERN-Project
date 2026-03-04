#!/usr/bin/env python3
"""
Generate a test PCAP file with various types of traffic for testing the DPI engine.
"""

from scapy.all import *
import random

def create_test_pcap(filename="test_traffic.pcap"):
    """Create a test PCAP file with various traffic types"""
    packets = []
    
    # Base IPs
    client_ip = "192.168.1.100"
    
    # Server IPs (simulated)
    servers = {
        "youtube": "142.250.185.206",
        "facebook": "157.240.3.35",
        "google": "172.217.14.206",
        "github": "140.82.121.4",
        "netflix": "54.76.122.191"
    }
    
    # Generate HTTPS traffic with SNI
    def create_tls_client_hello(client_ip, server_ip, domain):
        """Create a fake TLS Client Hello packet with SNI"""
        # This is a simplified TLS Client Hello structure
        # In reality, you'd need a proper TLS handshake
        
        # Create IP layer
        ip = IP(src=client_ip, dst=server_ip)
        
        # Create TCP layer (random source port, destination 443)
        tcp = TCP(sport=random.randint(50000, 60000), dport=443, flags="PA")
        
        # Simplified TLS Client Hello with SNI
        # Content Type: Handshake (0x16)
        # Version: TLS 1.0 (0x0301)
        tls_header = bytes([0x16, 0x03, 0x01])
        
        # Handshake Type: Client Hello (0x01)
        handshake_type = bytes([0x01])
        
        # Simplified payload with SNI extension
        # This is a very simplified version - real TLS is more complex
        sni_bytes = domain.encode('utf-8')
        sni_extension = bytes([
            0x00, 0x00,  # Extension type: SNI
            0x00, len(sni_bytes) + 5,  # Extension length
            0x00, len(sni_bytes) + 3,  # SNI list length
            0x00,  # SNI type: hostname
            0x00, len(sni_bytes),  # SNI length
        ]) + sni_bytes
        
        # Build a minimal but recognizable Client Hello
        client_hello = (
            tls_header +
            bytes([0x00, 0x00])  + # Length placeholder
            handshake_type +
            bytes([0x00, 0x00, 0x00])  + # Handshake length placeholder
            bytes([0x03, 0x03])  + # Client version
            bytes([0] * 32) +  # Random (32 bytes)
            bytes([0])  + # Session ID length
            bytes([0x00, 0x02])  + # Cipher suites length
            bytes([0x00, 0x2f])  + # Cipher suite
            bytes([0x01, 0x00])  + # Compression methods
            bytes([0x00, len(sni_extension) + 2])  + # Extensions length
            sni_extension
        )
        
        # Create packet
        pkt = ip / tcp / Raw(load=client_hello)
        return pkt
    
    # Generate HTTP traffic
    def create_http_request(client_ip, server_ip, host):
        """Create an HTTP GET request"""
        ip = IP(src=client_ip, dst=server_ip)
        tcp = TCP(sport=random.randint(50000, 60000), dport=80, flags="PA")
        
        http_request = f"GET / HTTP/1.1\\r\\nHost: {host}\\r\\nUser-Agent: Mozilla/5.0\\r\\n\\r\\n"
        pkt = ip / tcp / Raw(load=http_request.encode())
        return pkt
    
    # Generate some SYN packets (connection establishment)
    for server_ip in servers.values():
        syn = IP(src=client_ip, dst=server_ip) / TCP(sport=random.randint(50000, 60000), dport=443, flags="S")
        packets.append(syn)
    
    # Generate HTTPS traffic with SNI for different services
    print("Generating HTTPS traffic...")
    
    # YouTube traffic
    for i in range(5):
        pkt = create_tls_client_hello(client_ip, servers["youtube"], "www.youtube.com")
        packets.append(pkt)
        time.sleep(0.001)
    
    # Facebook traffic
    for i in range(3):
        pkt = create_tls_client_hello(client_ip, servers["facebook"], "www.facebook.com")
        packets.append(pkt)
        time.sleep(0.001)
    
    # Google traffic
    for i in range(4):
        pkt = create_tls_client_hello(client_ip, servers["google"], "www.google.com")
        packets.append(pkt)
        time.sleep(0.001)
    
    # GitHub traffic
    for i in range(2):
        pkt = create_tls_client_hello(client_ip, servers["github"], "github.com")
        packets.append(pkt)
        time.sleep(0.001)
    
    # Netflix traffic
    for i in range(3):
        pkt = create_tls_client_hello(client_ip, servers["netflix"], "www.netflix.com")
        packets.append(pkt)
        time.sleep(0.001)
    
    # Generate some HTTP traffic
    print("Generating HTTP traffic...")
    http_pkt = create_http_request(client_ip, "93.184.216.34", "example.com")
    packets.append(http_pkt)
    
    # Generate some DNS traffic
    print("Generating DNS traffic...")
    dns_query = IP(src=client_ip, dst="8.8.8.8") / UDP(sport=random.randint(50000, 60000), dport=53) / DNS(rd=1, qd=DNSQR(qname="www.google.com"))
    packets.append(dns_query)
    
    # Add some data packets
    for server_ip in list(servers.values())[:3]:
        data_pkt = IP(src=client_ip, dst=server_ip) / TCP(sport=random.randint(50000, 60000), dport=443, flags="PA") / Raw(load=b"\\x17\\x03\\x03" + bytes([0] * 100))
        packets.append(data_pkt)
    
    # Write to PCAP file
    print(f"Writing {len(packets)} packets to {filename}...")
    wrpcap(filename, packets)
    print(f"PCAP file created successfully: {filename}")
    print(f"File size: {os.path.getsize(filename)} bytes")

if __name__ == "__main__":
    import sys
    
    filename = sys.argv[1] if len(sys.argv) > 1 else "test_traffic.pcap"
    create_test_pcap(filename)
