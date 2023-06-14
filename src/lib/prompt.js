const readline = require("readline"),
        {spawnSync} = require('child_process'),
        fs = require('fs'),
        os = require('os'),
        {Transform} = require('stream');

module.exports.prompt = (questions) => {
    const answers = {};

    function askQuestion(question) {
        return new Promise(async (resolve) => {
            const {type, name, message, validate, filter, def} = question

            async function validateAnswer(answer) {
                if (validate) {
                    const resolvedValue = await validate(answer)
                    if (resolvedValue !== true) {
                        console.log(resolvedValue);
                        return false;
                    }
                }
                return true;
            }

            function applyFilter(answer) {
                return filter ? filter(answer) : answer;
            }

            function questionLoop() {
                if (type === 'editor') {
                    new Promise((resolve) => {
                        const rl = readline.createInterface({
                            input: process.stdin,
                            output: process.stdout,
                        });
                        rl.question(`${message}`, () => {
                            rl.close();
                            resolve();
                        });
                    }).then(async () => {
                        const tempFilePath = fs.mkdtempSync(`${os.tmpdir()}/`);
                        const tempFileFullPath = `${tempFilePath}/${name}.tmp`;
                        const editorCommand = process.env.EDITOR || 'vi'; // Use system default editor or vi if not defined
                        spawnSync(editorCommand, [tempFileFullPath], {stdio: 'inherit'});
                        const answer = fs.readFileSync(tempFileFullPath, 'utf8');
                        const isValid = await validateAnswer(answer);
                        if (isValid) {
                            answers[name] = applyFilter(answer);
                            resolve();
                            fs.unlinkSync(tempFileFullPath);
                        } else {
                            questionLoop();
                        }
                    })
                } else if (type === 'input') {
                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout,
                    });
                    const defaultValue = `${def ? ` (${def}) ` : ' '}`
                    rl.question(`${message}${defaultValue}:`, async (answer) => {
                        if (answer.trim().length === 0 && def) {
                            answer = def
                        }
                        const isValid = await validateAnswer(answer);
                        if (isValid) {
                            answers[name] = applyFilter(answer);
                            rl.close();
                            resolve();
                        } else {
                            rl.close();
                            questionLoop();
                        }
                    });
                } else if (type === 'confirm') {
                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout,
                    });
                    const defaultString = `${def ? '(y)' : 'y'}/${!def ? '(n)' : 'n'}`
                    rl.question(`${message} ${defaultString}: `, (rawAnswer) => {
                        answers[name] = !!(rawAnswer || `${def ? 'y' : 'n'}`).match(/^y(es)?$/i);
                        rl.close();
                        resolve();
                    });
                } else if (type === 'password') {
                    const stdin = process.stdin;
                    const stdout = process.stdout;
                    stdin.setRawMode(true);
                    stdin.resume();
                    stdout.write(`${message}: `);
                    let password = '';
                    stdin.pipe(new Transform({
                        encoding: 'utf8',
                        transform(chunk, encoding, callback) {
                            const hiddenChar = '*'.repeat(chunk.length)
                            this.push(hiddenChar);
                            callback();
                        },
                    })).pipe(stdout);
                    const handleKeypress = async (key) => {
                        const isEnterKey = key.toString() === '\r' || key.toString() === '\n';
                        if (isEnterKey) {
                            stdin.pause();
                            stdout.write('\n');
                            stdin.setRawMode(false);
                            stdin.removeListener('data', handleKeypress);
                            const isValid = await validateAnswer(password);
                            if (isValid) {
                                answers[name] = applyFilter(password);
                                stdin.unpipe();
                                stdout.unpipe();
                                resolve();
                            } else {
                                stdin.unpipe();
                                stdout.unpipe();
                                questionLoop();
                            }
                        } else {
                            password += key.toString();
                        }
                    };
                    stdin.on('data', handleKeypress);
                }
            }

            questionLoop();
        });
    }

    async function askQuestions() {
        for (const question of questions) {
            await askQuestion(question);
        }
        return answers;
    }

    return askQuestions();
}
