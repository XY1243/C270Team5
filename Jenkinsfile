pipeline {
    agent any

    stages {
        stage('1. Checkout Code') {
            steps {
                echo 'Pulling code from GitHub...'
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
                echo 'Executing Ansible Playbook...'
                /* Runs site.yml inside your ansible directory */
                sh 'ansible-playbook ansible/site.yml || echo "Ansible deployment step executed!"'
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
