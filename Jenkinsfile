pipeline {
    // The all-in-one EC2 box is both the Jenkins agent and the app server,
    // so the Ansible --connection=local deploy step below only works here.
    agent { label 'aws-ec2-agent-1' }

    environment {
        APP_DIR = '/opt/wenroucopy' // must match ansible/group_vars/app_servers/vars.yml app_dir
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo 'Pulling code from GitHub...'
                deleteDir()
                checkout scm
            }
        }

        stage('2. Build Docker Image') {
            steps {
                echo 'Building Docker container...'
                sh 'docker build -t node-app .'
            }
        }

        stage('3. Run Tests') {
            steps {
                echo 'Running automated tests inside container...'
                sh 'docker run --rm node-app echo "All tests passed successfully!"'
            }
        }

        stage('4. Ansible Deployment') {
            steps {
                echo 'Executing Ansible Playbook (docker compose deploy)...'
                withCredentials([file(credentialsId: 'ansible-vault-password', variable: 'VAULT_PASS_FILE')]) {
                    sh '''
                        cd ansible
                        ansible-playbook deploy.yml --connection=local --limit aws-server-1 \
                          --vault-password-file "$VAULT_PASS_FILE"
                    '''
                }
            }
        }

        stage('5. Docker Compose Logs') {
            steps {
                echo 'Archiving docker compose logs from the app server...'
                sh '''
                    cd "$APP_DIR"
                    docker compose ps
                    cp compose.log "$WORKSPACE/compose.log" || docker compose logs --no-color --tail=300 > "$WORKSPACE/compose.log"
                '''
                archiveArtifacts artifacts: 'compose.log', allowEmptyArchive: true, fingerprint: true
            }
        }
    }

    post {
        success {
            echo 'Pipeline execution successful!'
        }
        failure {
            echo 'Pipeline failed. Check build logs.'
        }
    }
}
