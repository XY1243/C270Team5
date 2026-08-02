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
  site.yml                 # main playbook (common -> docker -> app/jenkins) - run once to provision
  deploy.yml               # deploy-only playbook - run by Jenkins on every build
  inventory/hosts.ini       # your EC2 hosts, grouped
  group_vars/               # per-group variables (non-secret + vault)
  roles/
    common/                 # OS updates, firewall (ufw), base packages
    docker/                 # Docker Engine + Compose plugin install
    jenkins_agent/           # Java + Ansible + Jenkins agent systemd service
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

## Jenkins integration

`ansible/deploy.yml` is a ready-to-use deploy stage for whoever owns the
`Jenkinsfile` (repo root) to call after the build/test stages pass:

```
ansible-playbook deploy.yml --connection=local --limit aws-server-1 \
  --vault-password-file "$VAULT_PASS_FILE"
```

Run from the `ansible/` directory. `--connection=local` requires the Jenkins
job/pipeline to run directly on the EC2 box (the same all-in-one host acts as
both the Jenkins agent and the app server) — e.g. `agent { label
'aws-ec2-agent-1' }`, matching `jenkins_agent_name` in
[group_vars/jenkins_agents.yml](group_vars/jenkins_agents.yml) (the name the
box registers itself under in *Manage Jenkins > Nodes*).

`deploy.yml` only runs the `app_deploy` role (git pull + `.env` template +
`docker compose up -d --build`) — it assumes `site.yml` has already been run
once to provision Docker/firewall/jenkins agent.

Prerequisites for this stage to work:

1. Run `site.yml` at least once (see above) — this installs `ansible` on the
   box itself and grants the `jenkins` system user passwordless `sudo`
   (`/etc/sudoers.d/jenkins-agent`), both needed for the local deploy run.
2. In Jenkins, add a **Secret file** credential with ID
   `ansible-vault-password` containing just the vault password used to
   encrypt `group_vars/app_servers/vault.yml`.

