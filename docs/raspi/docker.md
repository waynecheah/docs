# Install Docker and Docker-Compose On Raspberry Pi

## Step 1: Update and Upgrade
```bash
sudo apt-get update && sudo apt-get upgrade
```

## Step 2: Check to see if you have any old Docker versions installed
```bash
sudo apt remove docker docker-engine docker.io containerd runc
sudo apt autoremove
```

## Step 3: Install Docker
```bash
curl -sSL https://get.docker.com | sh
```

## Step 4 (optional): Add a Current User to the Docker Group
### Manage Docker as a non-rootuser
Obviously, you don’t want to type “sudo” every time that you want to manage Docker. To get rid of this follow the below steps.
```bash
sudo groupadd docker
sudo usermod -aG docker ${USER}
newgrp docker
```
## Step 5: Enable the Docker system service to start your containers on boot
```bash
sudo systemctl enable docker.service
sudo systemctl enable containerd.service
```

Reboot the Raspberry Pi to let the changes take effect.

## Step 6: Install Docker-Compose requires pip3, so it needs to have python3 and pip3 installed
```bash
sudo apt-get install libffi-dev libssl-dev
sudo apt install python3-dev
sudo apt-get install -y python3 python3-pip
```

## Step 7: Install Docker-Compose
```bash
sudo pip3 install docker-compose
```

---

## Upgrade Docker on Raspberry Pi
```bash
sudo apt-get upgrade
```

## Uninstall Docker on Raspberry Pi
```bash
sudo apt-get purge docker-ce
```
* Note: Depending on the version of software, you may need to use an additional command to completely remove Docker:
  ```bash
  sudo apt-get purge docker-ce-cli
  ```

* To delete leftover images, containers, volumes and other related data, run the following command:
  ```bash
  sudo rm -rf /var/lib/docker
  ```
