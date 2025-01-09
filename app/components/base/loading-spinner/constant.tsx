import {
  PiBankDuotone,
  PiBellSimpleRingingDuotone,
  PiCurrencyCircleDollarDuotone,
  PiNotepadDuotone,
  PiPiggyBankDuotone,
  PiPlantDuotone,
  PiRecycleDuotone,
  PiShareFatDuotone,
  PiShoppingCartSimpleDuotone,
  PiStrategyDuotone,
  PiTargetDuotone,
  PiUniteDuotone,
  PiUsersThreeDuotone,
} from 'react-icons/pi'

export const icons = [
  PiUsersThreeDuotone,
  PiNotepadDuotone,
  PiBellSimpleRingingDuotone,
  PiBankDuotone,
  PiUniteDuotone,
  PiTargetDuotone,
  PiStrategyDuotone,
  PiShoppingCartSimpleDuotone,
  PiShareFatDuotone,
  PiRecycleDuotone,
  PiPiggyBankDuotone,
  PiPlantDuotone,
  PiCurrencyCircleDollarDuotone,
]

export const IconComponent = ({ counter }: { counter: number }) => {
  const Icon = icons[counter]
  return <Icon />
}
