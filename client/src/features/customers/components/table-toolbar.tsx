import Input from '#/components/input'
import React from 'react'
import { useTranslation } from 'react-i18next'

const TableToolbar = () => {
  const { t } = useTranslation('')
  return (
    <div className="flex items-center justify-between border-b border-borderColor p-4">
      <div>
        <Input className='py-1!' placeholder={t('Search')} />
      </div>
    </div>
  )
}

export default TableToolbar
