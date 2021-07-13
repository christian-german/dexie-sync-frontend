import { environment } from '../../../environments/environment';

export const colorsAffector = [
  {
    color: 'green',
    affectedTo: '',
  },
  {
    color: 'blue',
    affectedTo: '',
  },
  {
    color: 'orange',
    affectedTo: '',
  },
  {
    color: 'yellow',
    affectedTo: '',
  },
  {
    color: 'purple',
    affectedTo: '',
  }
]

function getAffectedColor(from: string): string {
  const alreadyAffected = colorsAffector.find(value => value.affectedTo === from);
  if (alreadyAffected) {
    return alreadyAffected.color;
  } else {
    for (let i = 0; i < colorsAffector.length; i++) {
      if (colorsAffector[i].affectedTo === '') {
        colorsAffector[i].affectedTo = from;
        break;
      }
    }
    return getAffectedColor(from);
  }
}

export const log = (from: string, message: string) => environment.production ? () => {} : console.info(`%c[${from}]: %c%s`, `color: ${getAffectedColor(from)};`, `color: black`, message)
export const logError = (from: string, message: string) => environment.production ? () => {} : console.info(`%c[${from}]: %c%s`, `color: ${getAffectedColor(from)};`, `color: red`, message)
