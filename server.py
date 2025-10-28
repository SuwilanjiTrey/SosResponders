#!/usr/bin/env python3
import http.server
import socketserver
import socket
import sys
import os

def get_local_ip():
    """Get the local IP address of this machine"""
    try:
        # Create a socket to determine local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"

def serve(directory=".", port=3000):
    """Serve a directory on the local network"""
    
    # Change to the specified directory
    if directory != ".":
        try:
            os.chdir(directory)
        except FileNotFoundError:
            print(f"Error: Directory '{directory}' not found")
            sys.exit(1)
    
    # Get local IP
    local_ip = get_local_ip()
    
    # Create the server
    Handler = http.server.SimpleHTTPRequestHandler
    
    # Allow reuse of address to avoid "Address already in use" errors
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(("0.0.0.0", port), Handler) as httpd:
            print(f"\n{'='*60}")
            print(f"🚀 Server running!")
            print(f"{'='*60}")
            print(f"\nLocal:            http://localhost:{port}")
            print(f"On Your Network:  http://{local_ip}:{port}")
            print(f"\nServing directory: {os.getcwd()}")
            print(f"\nPress CTRL+C to stop the server\n")
            print(f"{'='*60}\n")
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
        sys.exit(0)
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"\n❌ Error: Port {port} is already in use.")
            print(f"Try a different port: python3 {sys.argv[0]} [directory] [port]\n")
        else:
            print(f"\n❌ Error: {e}\n")
        sys.exit(1)

if __name__ == "__main__":
    # Parse command line arguments
    directory = "."
    port = 3000
    
    if len(sys.argv) > 1:
        directory = sys.argv[1]
    
    if len(sys.argv) > 2:
        try:
            port = int(sys.argv[2])
        except ValueError:
            print("Error: Port must be a number")
            sys.exit(1)
    
    serve(directory, port)
