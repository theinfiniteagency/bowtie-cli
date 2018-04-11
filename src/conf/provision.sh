#!/bin/sh
echo 'Importing bowtie-wordpress.sql to {{SITE_DB}}'
mysql --login-path=local -e "DROP DATABASE IF EXISTS {{SITE_DB}}"
mysql --login-path=local -e "CREATE DATABASE {{SITE_DB}}"
mysql --login-path=local {{SITE_DB}} < /var/www/{{SITE_DOMAIN}}/bowtie-wordpress.sql
sudo mv /var/www/{{SITE_DOMAIN}}/provision/nginx.conf /etc/nginx/sites-available/{{SITE_DOMAIN}}

echo "Generating self-signed SSL certificate"
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048  -subj "/CN={{SITE_DOMAIN}}" -keyout /etc/ssl/private/nginx-selfsigned-{{SITE_DB}}.key -out /etc/ssl/certs/nginx-selfsigned-{{SITE_DB}}.crt  > /dev/null 2>&1

echo "Enabling site"
sudo rm -f /etc/nginx/sites-enabled/{{SITE_DOMAIN}}
sudo ln -s /etc/nginx/sites-available/{{SITE_DOMAIN}} /etc/nginx/sites-enabled/{{SITE_DOMAIN}}
sudo rm -f /etc/nginx/sites-enabled/default

echo "Restarting NGINX"
sudo systemctl restart nginx