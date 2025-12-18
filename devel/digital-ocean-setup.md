Create a droplet (4 GB RAM, 80 GB disk, Ubuntu)

Enable 5000 inbound traffic in firewall
- Custom TCP 5000
- Don't forget to add the droplet to the firewall

apt-get install certbot python3-certbot-nginx -y

Make sure port 80 is open in the firewall on digital ocean
- In firewall, allow incoming http and https traffic

Configure domain to point to the droplet's IP
- For example your_domain_here
- Add an A record to your domain's IP

certbot --nginx -d your_domain_here

Get the following message:
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/jupyter1.nbfiddle.org/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/jupyter1.nbfiddle.org/privkey.pem
This certificate expires on 2025-06-12.
These files will be updated when the certificate renews.
Certbot has set up a scheduled task to automatically renew this certificate in the background.

nano /etc/nginx/sites-available/default

Add the following in the server section for 443

location / {
    proxy_pass http://127.0.0.1:8888/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}

# to check
nxing -t

systemctl restart nginx



```bash
pip install python3-pip
apt install python3.12-venv
apt install npm
python3 -m venv realtime512-env
git clone https://github.com/magland/realtime512
```

```bash
source realtime512-env/bin/activate
cd ~/realtime512
pip install -e .
cd figpack-realtime512-ui
npm install
npm run build
```

```bash
source ~/realtime512-env/bin/activate
cd
mkdir experiment1
# create electrode_coords.txt
# create simulate_raw.yaml in experiment1/

# run the following in a tmux session called realtime512
source ~/realtime512-env/bin/activate
cd ~/experiment1
realtime512 start
# will create realtime512.yaml and will start downloading files

# run the following in a tmux session called realtime512-serve
source ~/realtime512-env/bin/activate
cd ~/experiment1
realtime512 serve
```

Test that the server is listening by

```
curl http://your_domain_here/api/config
```

You can test locally via

```
curl http://localhost:5000/api/config
```

To update:

```bash
source ~/realtime512-env/bin/activate
cd ~/realtime512
git pull
cd figpack-realtime512-ui
npm install
npm run build
cd ..
pip install -e .
cd ~/experiment1

# attach to the tmux session running realtime512 start
# Stop it (Ctrl-C) and restart:
realtime512 start

# attach to the tmux session running realtime512 serve
# Stop it (Ctrl-C) and restart:
realtime512 serve
```

Navigate to `https://realtime512-dashboard.vercel.app?serverUrl=https://[your_domain_here]`

where `[your_domain_here]` is the domain you configured to point to your droplet.