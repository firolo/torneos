export const Participant = (props) => {
return (
    <div>
        {props.name}
        <button onClick={() => props.deleteParticipant(props.id)}> X </button>
    </div>
    )
}
