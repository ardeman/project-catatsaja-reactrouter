import { TCardColumnsProperties } from './type'

// Two stacks of cards from xl up, each flowing on its own so a short card
// leaves no gap beside a tall one. Below xl the stacks dissolve (`contents`)
// into one list, and `order` keeps the cards in reading order.
export const CardColumns = (properties: TCardColumnsProperties) => {
  const { cards } = properties
  const ordered = cards.map((card, index) => ({ ...card, order: index }))
  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      {([0, 1] as const).map((column) => (
        <div
          key={column}
          className="contents xl:grid xl:min-w-0 xl:gap-6"
        >
          {ordered
            .filter((card) => card.column === column)
            .map((card) => (
              <div
                key={card.key}
                className="grid min-w-0"
                style={{ order: card.order }}
              >
                {card.node}
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}
