# Install Raspbian Operating-System and prepare the system for Kubernetes

## STEP 1 - Raspberry Pi Headless Setup
1. Open the SD card location and open the file "cmdline.txt"
   Add the following to the end of the line of text
   ```text
   cgroup_memory=1 cgroup_enable=memory ip=192.168.1.31::192.168.1.254:255.255.255.0:rpimaster:eth0:off
   ```
   Use this for reference (ip=`<client-ip>:<server-ip>:<gw-ip>:<netmask>:<hostname>:<device>:<autoconf>`)
2. Open the file "config.txt"
   Add this line of config to the end of the file:
   ```text
   arm_64bit=1
   ```
3. Enable SSH access at root directory (eg. /Volumes/boot)
   ```bash
   touch ssh
   ```


## STEP 2 - K3s Prep
Switch Debian firewall to legacy config
```bash
sudo iptables -F
sudo update-alternatives --set iptables /usr/sbin/iptables-legacy
sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy
sudo reboot
```
### Change hostname
1. Edit the file `/etc/hostname` and replace `raspberrypi` by kube-master
   ```bash
   sudo nano /etc/hostname
   # kube-master
   ```
2. Edit the file `/etc/hosts` and replace `raspberrypi` (line 6) by `kube-master`
   ```bash
   sudo nano /etc/hosts
   # ...
   # 127.0.1.1       kube-master
   ```
### Upgrade the system
```bash
sudo apt-get update && sudo apt-get upgrade -y
```

## STEP 3 - K3s Install
1. 
   ```bash
   sudo su -
   ```
2. Install K3s (master node setup)
   ```bash
   curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC=" --no-deploy servicelb --no-deploy traefik" K3S_KUBECONFIG_MODE="644" sh -s -
   ```
3. Check that the systemd service started correctly
   ```bash
   systemctl status k3s
   ```
   ::: warning Note
   Uninstall K3S if anything goes wrong
   ```bash
   /usr/local/bin/k3s-uninstall.sh
   ```
   :::
4. Get the node token from the master
   ```bash
   sudo cat /var/lib/rancher/k3s/server/node-token
   ```
5. Copy the k3s config file from the master node to your local machine
   ```bash
   scp pi@192.168.1.22:/etc/rancher/k3s/k3s.yaml ~/.kube/config
   ```
6. The file contains endpoint 127.0.0.1, replace to master node IP address
   ```bash
   sed -i '' 's/127\.0\.0\.1/192\.168\.1\.22/g' ~/.kube/config
   ```
7. Use the cluster context
   ```bash
   kubectl config use-context Raspberry
   ```

## STEP 4 - K3s Install (worker node setup)
Run this command on your other Raspberry Pi nodes
```bash
curl -sfL https://get.k3s.io | K3S_TOKEN="YOURTOKEN" K3S_URL="https://[YOUR_SERVER_HOST]:6443" K3S_NODE_NAME="[NODE_WORKER_NAME]" sh -
```

Verify the status
```bash
systemctl status k3s-agent
```

::: warning Note
Uninstall K3S agent if anything goes wrong
```bash
/usr/local/bin/k3s-agent-uninstall.sh
```
:::

::: info Note
To remove any worker node from the cluster
```bash
kubectl drain kube-worker1 --ignore-daemonsets --delete-local-data
kubectl delete node kube-worker1
```
:::
