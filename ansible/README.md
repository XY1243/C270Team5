# Ansible: EC2 Provisioning & Configuration

Replaces manual server setup for the CI/CD pipeline. Two kinds of raw AWS EC2
instances (Ubuntu 22.04) are provisioned:

- **`jenkins_agents`** — installs Docker + registers the box as a Jenkins build
  agent so the `Jenkinsfile` can run `docker build` / `npm test` on it.
- **`app_servers`** — installs Docker + Docker Compose, clones this repo, and
  runs `docker compose up -d --build` to deploy the app (using the existing
  `Dockerfile` / `docker-compose.yml`).

## Layout

```
ansible/
  ansible.cfg              # default inventory, SSH user, become settings
  requirements.yml         # required Galaxy collections
  site.yml                 # main playbook (common -> docker -> app/jenkins)
  inventory/hosts.ini       # your EC2 hosts, grouped
  group_vars/               # per-group variables (non-secret + vault)
  roles/
    common/                 # OS updates, firewall (ufw), base packages
    docker/                 # Docker Engine + Compose plugin install
    jenkins_agent/           # Java + Jenkins agent systemd service
    app_deploy/              # git clone + .env template + docker compose up
```

## One-time setup

1. Launch the raw EC2 instances and note their public IPs / your SSH key.
2. Edit [inventory/hosts.ini](inventory/hosts.ini) with the real IPs.
3. Install the required collection:
   ```
   ansible-galaxy collection install -r requirements.yml
   ```
4. Fill in [group_vars/jenkins_agents.yml](group_vars/jenkins_agents.yml)
   with the real Jenkins controller URL and agent secret (from
   *Manage Jenkins > Nodes > <agent>*).
5. Create the app secrets vault:
   ```
   cp group_vars/app_servers/vault.yml.example group_vars/app_servers/vault.yml
   # fill in real DB_PASSWORD, JWT_SECRET, SMTP/Google creds, then:
   ansible-vault encrypt group_vars/app_servers/vault.yml
   ```

## Run it

```
ansible-playbook site.yml --ask-vault-pass
```

This provisions the servers, installs Docker on both groups, registers the
Jenkins agent, and deploys the containerized app — no manual SSH setup needed.
