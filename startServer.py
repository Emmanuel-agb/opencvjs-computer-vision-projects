import http.server
import socketserver
import webbrowser
import threading
import time

# Change these if needed
PORT = 8000
Handler = http.server.SimpleHTTPRequestHandler

def start_server():
    """Start an HTTP server on the specified PORT."""
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

def main_program():
    """
    Put your main program code here.
    For now, we'll just print something.
    You can import or call your other functions/classes here too.
    """
    print("Running my main program logic here...")

if __name__ == "__main__":
    # Start the server in a separate thread so we can run our main program too.
    server_thread = threading.Thread(target=start_server)
    server_thread.daemon = True
    server_thread.start()

    # Give the server a moment to start before we open the browser
    time.sleep(1)

    # Open the default browser to the local server
    webbrowser.open(f"http://127.0.0.1:{PORT}")

    # Now run your program logic
    main_program()

    # Keep script alive so the server doesn't stop
    print("Press Ctrl+C to stop the server...")
    while True:
        # Just sleep so we don't burn CPU in a tight loop
        time.sleep(0.5)
