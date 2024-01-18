import fs from "fs";


export const writeJsonFile = (path, object) => {
    const json = JSON.stringify(object, null, 4);
    fs.writeFileSync(path, json);
}
