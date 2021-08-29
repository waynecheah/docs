# Configure the SSD disk share

## Mount the disk to the master
1. Plug the SSD to the USB3.0 (blue) port
2. Find the disk name (drive)
    ```bash
    sudo fdisk -l
    ```
3. Manually mount the disk
    ```bash
    sudo mkdir /mnt/ssd
    sudo chown -R pi:pi /mnt/ssd/
    sudo mount /dev/sda1 /mnt/ssd
    ```
4. Automatically mount the disk on startup
    * Find the Unique ID of the disk using the command `blkid`
    ```bash
    sudo blkid
    # /dev/sda1: UUID="<get-uuid-here>" TYPE="ext4"
    ```
    * Edit the file `/etc/fstab`
    ```bash
    sudo nano /etc/fstab
    ```
    * Add the following line to configure auto-mount of the disk on startup.
    ```bash
    UUID=<uuid> /mnt/ssd ext4 defaults 0 0
    ```
5. Reboot the system
    ```bash
    sudo reboot
    ```
6. Verify the disk is correctly mounted on startup
    ```bash
    df -ha /dev/sda1
    ```

## Share via NFS Server
1. Install the required dependencies
    ```bash
    sudo apt-get install nfs-kernel-server -y
    ```
2. Configure the NFS server
    ```bash
    sudo nano /etc/exports
    ```
3. Add the following line
    ```sh
    /mnt/ssd *(rw,no_root_squash,insecure,async,no_subtree_check,anonuid=1000,anongid=1000)
    ```
4.  Start the NFS Server
    ```bash
    sudo exportfs -ra
    ```
5. All is done for master node setup

---

 ## Mount the NFS share (Worker Node only)
1. Install the necessary dependencies
    ```bash
    sudo apt-get install nfs-common -y
    ```
2. Create the directory to mount the NFS Share
    ```bash
    sudo mkdir /mnt/ssd
    sudo chown -R pi:pi /mnt/ssd/
    ```
3. Configure auto-mount of the NFS Share
    ```bash
    sudo nano /etc/fstab
    ```
    * Add the following line where 192.168.1.22:/mnt/ssd is the IP of kube-master and the NFS share path.
    ```sh
    192.168.1.22:/mnt/ssd   /mnt/ssd   nfs    rw  0  0
    ```
4. Reboot the system
    ```bash
    sudo reboot
    ```
