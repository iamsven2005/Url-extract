import socket
import subprocess
import os
import pandas as pd
from urllib.parse import urlparse
from bs4 import BeautifulSoup

urls = [
    "https://www.ywlgroup.com/",
    "https://www.bd.gov.hk/",
    "https://www.hyd.gov.hk/",
    "https://www.td.gov.hk/",
    "https://www.hko.gov.hk/",
    "https://www.cedd.gov.hk/",
    "https://www.wsd.gov.hk/",
    "https://www.dsd.gov.hk/",
    "https://www.devb.gov.hk/",
    "https://www.ginfo.cedd.gov.hk/GEOOpenData/eng/Default.aspx",
    "https://www.ginfo.cedd.gov.hk/GInfoInt/",
    "https://portal.csdi.gov.hk",
    "https://3d.map.gov.hk",
    "https://www.hkie.org.hk/",
    "https://www.ice.org.uk/",
    "https://www.newcivilengineer.com/",
    "https://www.steelforlifebluebook.co.uk/",
    "https://vsl.com/",
    "http://www.freyssinet.com/",
    "https://freyssinet.co.uk/",
    "https://www.hilti.com.hk/",
    "https://eurocodeapplied.com/",
    "https://academy.midasuser.com/",
    "https://www.seequent.com/getting-started-with-slope-w/",
    "https://structural-analyser.com/",
    "https://www.wolframalpha.com/",
    "https://www.mathway.com/",
    "https://en.wikipedia.org/",
    "https://zh.wikipedia.org/",
    "https://us06web.zoom.us/j/2891720849"
]

def get_ip(domain):
    try:
        return socket.gethostbyname(domain)
    except Exception as e:
        return f"Error: {e}"

def extract_third_party_urls(html, base_domain):
    soup = BeautifulSoup(html, 'html.parser')
    urls = set()

    for tag in soup.find_all(['script', 'img', 'link', 'iframe']):
        for attr in ['src', 'href']:
            link = tag.get(attr)
            if link:
                parsed = urlparse(link)
                if parsed.netloc and base_domain not in parsed.netloc:
                    urls.add(parsed.netloc)
    return urls

rows = []

for url in urls:
    query_domain = urlparse(url).netloc
    root_ip = get_ip(query_domain)
    rows.append({
        "Query Domain": query_domain,
        "Domain": query_domain,
        "IP Address": root_ip
    })

    try:
        result = subprocess.run(['curl', '-sL', url], stdout=subprocess.PIPE, timeout=10)
        html = result.stdout.decode('utf-8', errors='ignore')
        third_party_domains = extract_third_party_urls(html, query_domain)

        for tp_domain in third_party_domains:
            tp_ip = get_ip(tp_domain)
            rows.append({
                "Query Domain": query_domain,
                "Domain": tp_domain,
                "IP Address": tp_ip
            })

    except subprocess.TimeoutExpired:
        rows.append({
            "Query Domain": query_domain,
            "Domain": "[Timeout]",
            "IP Address": "Timed out"
        })
    except Exception as e:
        rows.append({
            "Query Domain": query_domain,
            "Domain": "[Error]",
            "IP Address": str(e)
        })

# Save to Excel
df = pd.DataFrame(rows)
downloads_path = os.path.join(os.path.expanduser("~"), "Downloads", "web_domain_ips.xlsx")
df.to_excel(downloads_path, index=False)
print(f"\n✅ Excel saved to: {downloads_path}")
