#!/usr/bin/env node
let inquirer;
import('inquirer').then(module => {
    inquirer = module;
});

const { program } = require('commander');
const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

program
  .version('0.0.1')
  .description('AuthNest: Speed up development for authentication and dashboard functionalities.');

program
  .command('setup')
  .description('Setup AuthNest with your Supabase or Firebase credentials.')
  .action(setup);

  async function setup() {
    const inquirer = await import('inquirer').then(module => module.default);

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'backend',
            message: 'Which backend would you like to set up?',
            choices: ['Supabase', 'Firebase'],
        },
    ]);

    if (answers.backend === 'Supabase') {
        const supabaseCredentials = await inquirer.prompt([
            {
                type: 'input',
                name: 'url',
                message: 'Enter your Supabase URL:',
            },
            {
                type: 'input',
                name: 'publicAnonKey',
                message: 'Enter your Supabase public anon key:',
            },
        ]);

        const supabase = createClient(supabaseCredentials.url, supabaseCredentials.publicAnonKey);
        console.log('Supabase client initialized!');
        
        // TODO: Save the credentials somewhere (e.g., a config file) for future use
        fs.writeFileSync('supabaseConfig.json', JSON.stringify(supabaseCredentials));

    } else if (answers.backend === 'Firebase') {
        const firebaseCredentials = await inquirer.prompt([
            {
                type: 'input',
                name: 'serviceAccountPath',
                message: 'Enter the path to your Firebase service account JSON file:',
            },
        ]);

        const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(firebaseCredentials.serviceAccountPath), 'utf-8'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin SDK initialized!');
        
        // TODO: Save the path to the service account JSON somewhere (e.g., a config file) for future use
        fs.writeFileSync('firebaseConfig.json', JSON.stringify({ path: firebaseCredentials.serviceAccountPath }));

    }

    console.log('Setup complete!');
}

//templates
program
  .command('generate')
  .description('Generate authentication and dashboard templates.')
  .action(generateTemplates);

async function generateTemplates() {
    // Load templates
    const inquirer = await import('inquirer').then(module => module.default);

    // Prompt user for customization preferences
    const customization = await inquirer.prompt([
        {
            type: 'list',
            name: 'theme',
            message: 'Choose a color theme:',
            choices: ['Light', 'Dark'],
        },
        {
            type: 'confirm',
            name: 'rememberMe',
            message: 'Include "Remember Me" checkbox in login?',
            default: false,
        },
        {
            type: 'confirm',
            name: 'phoneNumber',
            message: 'Include "Phone Number" field in signup?',
            default: false,
        }
    ]);


    const loginTemplate = fs.readFileSync('./templates/login.hbs', 'utf-8');
    const signupTemplate = fs.readFileSync('./templates/signup.hbs', 'utf-8');
    const dashboardTemplate = fs.readFileSync('./templates/dashboard.hbs', 'utf-8');

    // Compile templates
    const login = Handlebars.compile(loginTemplate);
    const signup = Handlebars.compile(signupTemplate);
    const dashboard = Handlebars.compile(dashboardTemplate);

    // Convert the theme value to the correct format
    customization.theme = customization.theme.charAt(0).toUpperCase() + customization.theme.slice(1);

    // Generate HTML files (you can also pass data to these functions if needed)
    fs.writeFileSync('login.html', login(customization));
    fs.writeFileSync('signup.html', signup(customization));
    fs.writeFileSync('dashboard.html', dashboard(customization));

    console.log('Templates generated successfully!');
}


program.parse(process.argv);
