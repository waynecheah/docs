# Programming The OLED Stats Display

## Enabling & Testing I2C Communication
```bash
sudo raspi-config
```
Enable I2C communication on the Pi
* Select `Interface Options`

  ![An image](/assets/oled/oled01.png)
* Select `I2C` 

  ![An image](/assets/oled/oled02.png)
* Confirm I2C with `Yes`

  ![An image](/assets/oled/oled03.png)


Reboot the Pi by typing in the following command
```bash
sudo reboot
```

Check that the following 3 libraries have been installed
```bash
sudo apt-get install python-smbus
sudo apt-get install i2c-tools
sudo pip3 install Adafruit_BBIO
```

Check Raspberry Pi if the display is connected
```bash
sudo i2cdetect -y 1
```

You should then see a table, similar to the below. This code indicates the I2C address of your display.
```
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f
00:          -- -- -- -- -- -- -- -- -- -- -- -- -- 
10: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
20: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
30: -- -- -- -- -- -- -- -- -- -- -- -- 3c -- -- -- 
40: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
50: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
60: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
70: -- -- -- -- -- -- -- -- 
```

## Downloading And Running The Adafruit Stats Script

Download the script by typing in the following commands:
```bash
sudo python -m pip install --upgrade pip setuptools wheel
git clone https://github.com/adafruit/Adafruit_Python_SSD1306.git
```

Next, navigate to your library’s directory:
```bash
cd Adafruit_Python_SSD1306
```

Then run the setup script to install the library
```bash
sudo python3 setup.py install
```

Next navigate to the examples directory in the Adafruit directory:
```bash
cd examples
```

Then execute the stats script, then see your Pi’s stats shown on the display.
```bash
python3 stats.py
```

## Adjusting The Display Content & Layout

Add the following two lines to the script `stats.py` at the end of the “# Shell scripts for system monitoring from here”
```
...
cmd = "df -h | awk '$NF==\"/\"{printf \"Disk: %d/%dGB %s\", $3,$2,$5}'"
Disk = subprocess.check_output(cmd, shell = True )
<ADD HERE>
```
```python
cmd = "vcgencmd measure_temp |cut -f 2 -d '='"
temp = subprocess.check_output(cmd, shell = True )
```

Replace the following lines in the “# Write two lines of text” section.
```python
draw.text((x, top+2), "IP: " + str(IP,'utf-8'), font=font, fill=255)
draw.text((x, top+18), str(CPU,'utf-8') + " " + str(temp,'utf-8') , font=font, fill=255)
draw.text((x, top+34), str(MemUsage,'utf-8'), font=font, fill=255)
draw.text((x, top+50), str(Disk,'utf-8'), font=font, fill=255)
```

Comment out the line near the top which sets the display size to 128 x 32:
```python
# disp = Adafruit_SSD1306.SSD1306_128_32(rst=RST)
```

And then uncomment the line which sets the display size to 128 x 64:
```python
disp = Adafruit_SSD1306.SSD1306_128_64(rst=RST)
```

Download the font PixelOperator.ttf from [pixel-operator.font](https://www.dafont.com/pixel-operator.font) and then unzip the contents of the download.

Look for the standard pixel operator font and copy the font into the same directory as your stats script.
```
scp PixelOperator.ttf pi@192.168.1.22:/home/pi/Adafruit_Python_SSD1306/examples
```

Comment out the line which loads the default font:
```python
# Load default font.
# font = ImageFont.load_default()
```

Uncomment the line which loads the replacement font and paste your filename into it
```python
# Some other nice fonts to try: http://www.dafont.com/bitmap.php
font = ImageFont.truetype('/home/pi/Adafruit_Python_SSD1306/examples/PixelOperator.ttf', 16)
```

## Setting The Script To Run Automatically On Startup

Provide execution permissions to the file `stats.py`
```bash
chmod +x stats.py
```

Open crontab by typing the following command into your terminal:
```bash
crontab -e
```

Add the following line to the end of the file to run the script:
```bash
@reboot python3 /home/pi/Adafruit_Python_SSD1306/examples/stats.py &
```
