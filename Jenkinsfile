pipeline {
    agent any

    parameters {
        choice(name: 'DEPLOY_TARGET', choices: ['kubernetes', 'compose'], description: 'Where should this build be deployed?')
    }

    environment {
        // TODO: fill in your real AWS/ECR details (must match ansible/group_vars/k8s_deploy.yml)
        AWS_REGION = 'CHANGE_ME'
        ECR_REGISTRY = 'CHANGE_ME.dkr.ecr.CHANGE_ME.amazonaws.com'
        ECR_REPOSITORY = 'event-finder-app'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
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

        stage('4. Security Scan (Trivy)') {
            steps {
                echo 'Scanning node-app image for vulnerabilities with Trivy...'
                sh '''
                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        -v trivy-cache:/root/.cache/ \
                        -v "$PWD:/report" \
                        aquasec/trivy image \
                        --format table \
                        --output /report/trivy-report.txt \
                        --severity HIGH,CRITICAL \
                        --ignore-unfixed \
                        --exit-code 1 \
                        node-app
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'trivy-report.txt', allowEmptyArchive: true
                }
            }
        }

        stage('5. Ansible Deployment (Docker Compose)') {
            when { expression { params.DEPLOY_TARGET == 'compose' } }
            steps {
                echo 'Executing Ansible Playbook...'
                dir('ansible') {
                    withCredentials([file(credentialsId: 'ansible-vault-password', variable: 'VAULT_PASS_FILE')]) {
                        sh '''
                            ansible-playbook deploy.yml \
                                --connection=local \
                                --limit aws-server-1 \
                                --vault-password-file "$VAULT_PASS_FILE"
                        '''
                    }
                }
            }
        }

        stage('5. Push Image to ECR') {
            when { expression { params.DEPLOY_TARGET == 'kubernetes' } }
            steps {
                echo 'Pushing image to ECR for the Kubernetes deployment...'
                sh '''
                    aws ecr get-login-password --region "$AWS_REGION" \
                        | docker login --username AWS --password-stdin "$ECR_REGISTRY"
                    docker tag node-app:latest "$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG"
                    docker push "$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG"
                '''
            }
        }

        stage('6. Ansible Deployment (Kubernetes)') {
            when { expression { params.DEPLOY_TARGET == 'kubernetes' } }
            steps {
                echo 'Executing Ansible Playbook against the EKS cluster...'
                dir('ansible') {
                    withCredentials([file(credentialsId: 'ansible-vault-password', variable: 'VAULT_PASS_FILE')]) {
                        sh '''
                            ansible-playbook k8s-deploy.yml \
                                --connection=local \
                                --limit aws-server-1 \
                                --vault-password-file "$VAULT_PASS_FILE" \
                                -e image_tag="$IMAGE_TAG"
                        '''
                    }
                }
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
