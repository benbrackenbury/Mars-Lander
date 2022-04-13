// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import fs from 'fs'
import path from 'path'


export default function handler(req, res) {
    const dirRelativeToPublicFolder = 'assets/profiles'
    const dir = path.resolve('./public', dirRelativeToPublicFolder)
    const filenames = fs.readdirSync(dir)
    const profilePaths = filenames.map(name => path.join('/', dirRelativeToPublicFolder, name))

    const profiles = profilePaths.map(profilePath => {
        const filename = profilePath.split('/assets/profiles/')[1]
        const profile = JSON.parse(fs.readFileSync(path.join(dir, filename), 'utf8'))
        profile.path = profilePath
        profile.id = filename.split('.json')[0]
        return profile
    })

    res.status(200).json({ profiles })
}