# DDNS on a Raspberry Pi using the Cloudflare API

## Setup the script
1. Clone the script using GIT
   ```bash
   git clone https://github.com/K0p1-Git/cloudflare-ddns-updater
   ```
2. Change directories into the script directory
   ```bash
   cd cloudflare-ddns-updater
   ```
3. Make a copy of the script
   ```bash
   cp cloudflare-template.sh cloudflare.sh
   ```
4. Edit the script

   ```bash
   nano cloudflare.sh
   ```
5. Fill the value to `auth_email`, `auth_key`, `zone_identifier`, and `record_name`
6. Make the script executable and launch it
   ```bash
   chmod +x cloudflare.sh
   ```

## Automate the script
1. Launch crontab
```bash
crontab -e
```
2. Add this line of config to the end of the crontab settings
```bash
*/2 * * * * /usr/bin/bash /home/pi/cloudflare.sh
```
3. Save
