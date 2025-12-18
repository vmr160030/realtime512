Create a droplet (4 GB RAM, 80 GB disk, Ubuntu)

Enable 5000 inbound traffic in firewall
- Custom TCP 5000
- Don't forget to add the droplet to the firewall

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

Navigate to `https://realtime512-dashboard.vercel.app?serverUrl=http://[IP]:5000`

where `[IP]` is the public IP address of your droplet.