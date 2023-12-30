export const loadConfig = () => {
    const config = {}
    config.postgres = {
        host: '127.0.0.1',
        port: 8812,
        database: 'qdb',
        user: 'admin',
        password: 'quest',
    }
    return config
}