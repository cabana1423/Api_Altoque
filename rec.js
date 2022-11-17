
let fs = require('fs')
let path = require('path')
 
// Obtener parámetros de línea de comando
let parm = process.argv.splice(2)
 // El primer parámetro es la ruta
let rootPath = parm[0]
 // Todos los parámetros posteriores son sufijos de archivo
let types = parm.splice(1)
 // Carpeta a filtrar
let filter = ['./node_modules']
 // resultados estadísticos
let num = 0
 
 // Obtener el número de filas
async function line(path) {
    let rep = await fs.readFileSync(path)
    rep = rep.toString()
    let lines = rep.split('\n')
    console.log(path + ' ' + lines.length)
    num += lines.length
}
 
 // Estadísticas recursivas de todas las carpetas
async function start(pt) {
    let files = fs.readdirSync(pt)
    files
        .map(file => {
            return `${pt}/${file}`
        })
        .forEach(file => {
            let stat = fs.statSync(file)
            if (stat.isDirectory()) {
                if (filter.indexOf(pt) != -1) {
                    return
                }
                start(file)
                return
            }
            let ext = path.extname(file)
            if (types.indexOf(ext) != -1) {
                line(file)
            }
        })
}
 
;(async () => {
    await start(rootPath)
         console.log (`Total de líneas de código: ${num}`)
})();
