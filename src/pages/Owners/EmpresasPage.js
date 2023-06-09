import { useState, useEffect, useRef } from 'react'
import { useDebounce } from 'use-debounce'
import styled from 'styled-components'
import IterableComponent from '../../components/IterableComponent'
import ModalForm from '../../components/ModalForm'
import InputForm from '../../components/inputs/InputForm'
import Swal from 'sweetalert2'
import Loader from '../../components/Loader'
import NoDataMessage from '../../components/NoDataMessage'
import { FaMagnifyingGlass, FaPlus, FaTrash, FaPenToSquare, FaEye } from '../../images/Icons/IconsFontAwesome'

const Empresas = ({ className }) => {

    const [empresasList, setIdEmpresasList] = useState([])
    const [showInputSearch, setShowInputSearch] = useState(false)
    const [textInputSearch, setTextInputSearch] = useState('')
    const [textSearch] = useDebounce(textInputSearch, 1500)
    const [isFetching, setIsFetching] = useState(false)
    const [modalView, setModalView] = useState(false)
    const [modalCreate, setModalCreate] = useState(false)
    const [modalUpdate, setModalUpdate] = useState(false)
    const [idEmpresa, setIdEmpresa] = useState(null)
    const [inputs, setInputs] = useState({
        inputNit : '',
        inputRazonSocial : '',
        inputPersonaRepsonsable: '',
        inputDireccion: '',
        inputFechaLicencia : ''
    })

    const inputSearch = useRef()
    const formView = useRef()
    const formCreate = useRef()
    const formUpdate = useRef()

    const toggleSearchInput = () => setShowInputSearch(!showInputSearch)
    const closeModal = (setClose, formModal) => {
        setInputs({
            ...inputs,
            inputNit : '',
            inputRazonSocial : '',
            inputPersonaRepsonsable: '',
            inputDireccion: '',
            inputFechaLicencia : ''
        })
        setClose(false)
        formModal.current.reset()
    }

    const loadEmpresas = async(filter = '') => {
        setIsFetching(true)
        const response = await fetch('http://localhost:3001/empresas'+filter)
        const {dataProcess} = await response.json()

        if (dataProcess === 'Not empresas Uvaliable') {
            setIdEmpresasList([])
            setTimeout(() => {
                setIsFetching(false)
            }, 500);
            return false
        }

        setIdEmpresasList(dataProcess)
        setIsFetching(false)
    }

    const loadInfoModal = async(id, showModal) => {
        setIsFetching(true)
        const response = await fetch('http://localhost:3001/empresas/id/'+id)
        const {infoProcess, error, dataProcess} = await response.json()

        if (infoProcess === 'error') {
            setTimeout(() => {
                setIsFetching(false)
            }, 500);

            Swal.fire(
                'Ha ocurrido un error',
                error === 'empresaNotFound' ? 'Empresa no encontrada' : error,
                'error'
            )
            return false
        }
        
        setInputs({
            ...inputs,
            inputNit: dataProcess.empresa_NIT,
            inputRazonSocial: dataProcess.empresa_razon_social,
            inputPersonaRepsonsable: dataProcess.empresa_persona_responsable,
            inputDireccion: dataProcess.empresa_direccion,
            inputFechaLicencia: dataProcess.empresa_fecha_licencia
        })

        setIdEmpresa(id)
        showModal(true)
        setTimeout(() => {
            setIsFetching(false)
        }, 500);
    }

    const handleSubmit = async (action, form) => {
        const [nit, razonSocial, personaResponsable, direccion, fechaExpLicencia] = form
        const data = {
            nit: nit.value,
            razonSocial: razonSocial.value,
            personaResponsable: personaResponsable.value,
            direccion: direccion.value,
            fechaExpLicencia: fechaExpLicencia.value
        }

        const url = action === 'create' ? 'http://localhost:3001/empresas/createEmpresa' : 'http://localhost:3001/empresas/updateEmpresa/' + idEmpresa
        const method = action === 'create' ? 'POST' : 'PUT'
        const params = {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }

        const setClose = action === 'create' ? setModalCreate : setModalUpdate
        const formModal = action === 'create' ? formCreate : formUpdate

        const response = await fetch(url, params)
        const {error, infoProcess} = await response.json()

        if (infoProcess === 'error') {
            let messageError;

            if (error === 'empresaNotFound') {
                messageError = 'Empresa no encontrado'
            }else {
                messageError = 'No se pudo crear la empresa, revise bien la informacion enviada'
            }

            Swal.fire(
                'Ha ocurrido un error',
                messageError,
                'error'
            )

            return false
        }

        Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: action === 'create' ? 'Empresa creado exitosamente' : 'Empresa actualizado exitosamente',
            showConfirmButton: false,
        }).then(() => {
            setIdEmpresa(null)
            closeModal(setClose, formModal)
        })

        loadEmpresas()
    }

    const deleteEmpresa = (id) => {
        Swal.fire({
            title: 'Estas seguro?',
            text: "Deseas eliinar este empresa?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Si'
        }).then(async (result) => {
            if (result.isConfirmed) {
                
                const url = 'http://localhost:3001/empresas/deleteEmpresa/' + id
                const params = {
                    method: 'DELETE', 
                    headers: { 'Content-Type': 'application/json' }
                }

                const result = await fetch(url, params)
                const {infoProcess, error} = await result.json()

                if (infoProcess === 'error') {
                    setTimeout(() => {
                        setIsFetching(false)
                    }, 500);
                    
                    Swal.fire(
                        'Ha ocurrido un error',
                        error === 'empresaNotFound' ? 'Empresa no encontradad' : error,
                        'error'
                    )

                    return false
                }
                
                setTimeout(() => {
                    setIsFetching(false)
                }, 500);

                Swal.fire({
                    position: 'top-end',
                    icon: 'success',
                    title: 'Empresa eliminada',
                    showConfirmButton: false,
                }).then(() => {
                    loadEmpresas()
                })
            }
        })
    }

    useEffect(() => {
        loadEmpresas()
    }, [])

    useEffect(() => {
        console.log(inputs);
    }, [inputs])

    useEffect(() => {
        loadEmpresas('/'+textSearch)
    }, [textSearch])

    return (
        <div className={className}>

            { isFetching && <Loader/> }

            <div className='title-page' onMouseLeave={() => setShowInputSearch(false)} >
                <h2>Empresas</h2>

                <div className='box-filter'>
                    <button onMouseEnter={() => setShowInputSearch(true)} onClick={() => toggleSearchInput(true)} >
                        {FaMagnifyingGlass}
                    </button>

                    <button onClick={() => setModalCreate(true)} >
                        {FaPlus}
                    </button>

                    <input
                        type="text"
                        placeholder='Empresa...'
                        className={showInputSearch ? 'active' : ''}
                        ref={inputSearch}
                        onBlur={() => setShowInputSearch(false)}
                        onChange={() => setTextInputSearch(inputSearch.current.value)}
                    />
                </div>
            </div>

            <div className='content-page'>
                {
                    empresasList.length > 0 ?
                    empresasList.map(({empresa_NIT: id, empresa_razon_social: nombre, empresa_fecha_licencia: fechaExp }) => (
                            <IterableComponent key={id} title={nombre} description={`Fexha exp licencia: `+fechaExp}
                                methods={[
                                    { description: FaEye, action: () => loadInfoModal(id, setModalView) },
                                    { description: FaPenToSquare, action: () => loadInfoModal(id, setModalUpdate) },
                                    { description: FaTrash, action: () => deleteEmpresa(id) },
                                ]}
                            />
                        )
                    )
                    :
                    <NoDataMessage>
                        <div>
                            <h1>Upss!<br/> <span>No hay Empresas registradas todavía.</span></h1>
                        </div>
                    </NoDataMessage>
                }
            </div>

            <ModalForm titleModal='Información Empresa' active={modalView} formModal={formView} setClose={setModalView} method={closeModal}>
                <form ref={formView}>
                    <InputForm isBlock type='number' text='Nit Empresa' value={inputs.inputNit} />
                    <InputForm isBlock type='text' text='Razon Social' value={inputs.inputRazonSocial} />
                    <InputForm isBlock type='text' text='Persona responsable' value={inputs.inputPersonaRepsonsable} />
                    <InputForm isBlock type='text' text='Dirección' value={inputs.inputDireccion} />
                    <InputForm isBlock type='date' text='Fecha de licencia' value={inputs.inputFechaLicencia} />
                </form>
            </ModalForm>

            <ModalForm titleModal='Nueva Empresa' active={modalCreate} formModal={formCreate} setClose={setModalCreate} method={closeModal}>
                <form ref={formCreate} onSubmit={(event) => { event.preventDefault(); handleSubmit('create', event.target) }}>
                    <InputForm type='number' text='Nit Empresa' />
                    <InputForm type='text' text='Razon Social' />
                    <InputForm type='text' text='Persona responsable' />
                    <InputForm type='text' text='Dirección' />
                    <InputForm type='date' text='Fecha de licencia' />
                    <input type="submit" value='Guardar' />
                </form>
            </ModalForm>

            <ModalForm titleModal='Editar información empresa' active={modalUpdate} formModal={formUpdate} setClose={setModalUpdate} method={closeModal}>
                <form ref={formUpdate} onSubmit={(event) => { event.preventDefault(); handleSubmit('update', event.target) }}>
                    <InputForm active type='number' text='Nit Empresa' value={inputs.inputNit} />
                    <InputForm active type='text' text='Razon Social' value={inputs.inputRazonSocial} />
                    <InputForm active type='text' text='Persona responsable' value={inputs.inputPersonaRepsonsable} />
                    <InputForm active type='text' text='Dirección' value={inputs.inputDireccion} />
                    <InputForm active type='date' text='Fecha de licencia' value={inputs.inputFechaLicencia} />
                    <input type="submit" value='Editar' />
                </form>
            </ModalForm>
        </div>
    )
}



const EmpresasPage = styled(Empresas)`

    .title-page{
        padding: 3rem 2rem;
        position: relative;
    }

    .title-page h2{
        font-size: 2.4rem;
        font-weight: normal;
    }

    .box-filter{
        position: absolute;
        bottom: 0;
        right: 5%;
        display: flex;
        flex-direction: column;
    }

    .box-filter input{
        position: absolute;
        top: 10%;
        left: -300%;
        padding: 4px;
        border: none;
        transform: translateX(-100%);
        opacity: 0;
        visibility: hidden;
        border-bottom: 1px solid #54B9D9;
        transition: all 0.3s ease-in-out;
        z-index: 5;
    }

    .box-filter input::placeholder{
        color: #e1e1e1;
    }

    .box-filter input.active{
        opacity: 1;
        visibility: visible;
        left: -100%;
    }

    .box-filter button{
        background-color: transparent;
        border: none;
        margin: 5px 0;
        font-size: 20px;
        cursor: pointer;
        z-index: 10;
    }

    .content-page{
        padding: 0 2rem;
        display: flex;
        justify-content: flex-start;
        flex-wrap: wrap;
    }

`

export default EmpresasPage