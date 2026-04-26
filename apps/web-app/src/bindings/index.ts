import { GreetService } from '../../bindings/changeme'

export const callGreetService = () => {
    GreetService.Greet('asdasdasda')
        .then((result: string) => {
            console.log(result)
        })
}
