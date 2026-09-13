export default function ParticipantsList({ participants }) {
  return <aside className="participants"><div className="section-label">In this room</div>{participants.map((participant) => <div className="participant" key={participant.id}><span className="presence" />{participant.name}<small>{participant.role}</small></div>)}</aside>;
}
